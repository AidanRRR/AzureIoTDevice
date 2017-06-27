'use strict';

// Packages
var Protocol = require('azure-iot-device-mqtt').Mqtt;
var Client = require('azure-iot-device').Client;
var ConnectionString = require('azure-iot-device').ConnectionString;
var Message = require('azure-iot-device').Message;

// Device setup
var connectionString = 'HostName=VectrIoTHubTest.azure-devices.net;DeviceId=DummyDevice1;SharedAccessKey=SH1jW5Kspc49aBXyJGEJrpQx7W8TBSwzT29kb8JY6Gw=';
var deviceId = ConnectionString.parse(connectionString).DeviceId;

// Params
var temperature = 50;
var humidity = 50;
var externalTemperature = 55;
var longitude = 50;
var latitude = 50;
var airquality = 50;
var o2 = 20;
var co2 = 20;

// Print operation
function printErrorFor(op) {
  return function printError(err) {
    if (err)
      console.log(op + ' error: ' + err.toString());
  }
}

// Randomize telemetry data
function generateRandomIncrement() {
  return ((Math.random() * 2) - 1);
}

// Randomize longitude latitude
function generateLongitudeLatitude(from, to, fixed) {
  return (Math.random() * (to - from) + from).toFixed(fixed) * 1;
}

function generateRandomNumber(from, to) {
  console.log('hallo');
  return (Math.floor((Math.random() * to) + from));
}

// DeviceInfo on startup
var deviceMetaData = {
  'ObjectType': 'DeviceInfo',
  'IsSimulatedDevice': 0,
  'Version': '1.0',
  'DeviceProperties': {
    'DeviceID': deviceId,
    'HubEnabledState': 1
  }
};

// Device twin reported values
var reportedProperties = {
  'Device': {
    'DeviceState': 'normal',
    'Location': {
      'Latitude': 47.642877,
      'Longitude': -122.125497
    }
  },
  'Config': {
    'TemperatureMeanValue': 56.7,
    'TelemetryInterval': 45
  },
  'System': {
    'Manufacturer': 'Contoso Inc.',
    'FirmwareVersion': '2.22',
    'InstalledRAM': '8 MB',
    'ModelNumber': 'DB-14',
    'Platform': 'Plat 9.75',
    'Processor': 'i3-9',
    'SerialNumber': 'SER99'
  },
  'Location': {
    'Latitude': 47.642877,
    'Longitude': -122.125497
  },
  'SupportedMethods': {
    'Reboot': 'Reboot the device',
    'InitiateFirmwareUpdate--FwPackageURI-string': 'Updates device Firmware. Use parameter FwPackageURI to specifiy the URI of the firmware file'
  }
}

// Reboot direct call
function onReboot(request, response) {
  // Implement actual logic here.
  console.log('Simulated reboot...');

  // Complete the response
  response.send(200, "Rebooting device", function (err) {
    if (!!err) {
      console.error('An error ocurred when sending a method response:\n' + err.toString());
    } else {
      console.log('Response to method \'' + request.methodName + '\' sent successfully.');
    }
  });
}

// Initiate firmware update
function onInitiateFirmwareUpdate(request, response) {
  console.log('Simulated firmware update initiated, using: ' + request.payload.FwPackageURI);

  // Complete the response
  response.send(200, "Firmware update initiated", function (err) {
    if (!!err) {
      console.error('An error ocurred when sending a method response:\n' + err.toString());
    } else {
      console.log('Response to method \'' + request.methodName + '\' sent successfully.');
    }
  });

  // Add logic here to perform the firmware update asynchronously
}

// Create client instance
var client = Client.fromConnectionString(connectionString, Protocol);

// Open the connection.
// Send the DeviceInfo object.
// Set up a handler for desired properties.
// Send reported properties.
// Register handlers for the direct methods.
// Start sending telemetry.
client.open(function (err) {
  if (err) {
    printErrorFor('open')(err);
  } else {
    console.log('Sending device metadata:\n' + JSON.stringify(deviceMetaData));
    client.sendEvent(new Message(JSON.stringify(deviceMetaData)), printErrorFor('send metadata'));

    // Create device twin
    client.getTwin(function (err, twin) {
      if (err) {
        console.error('Could not get device twin');
      } else {
        console.log('Device twin created');

        twin.on('properties.desired', function (delta) {
          console.log('Received new desired properties:');
          console.log(JSON.stringify(delta));
        });

        // Send reported properties
        twin.properties.reported.update(reportedProperties, function (err) {
          if (err) throw err;
          console.log('twin state reported');
        });

        // Register handlers for direct methods
        client.onDeviceMethod('Reboot', onReboot);
        client.onDeviceMethod('InitiateFirmwareUpdate', onInitiateFirmwareUpdate);
      }
    });

    // Start sending telemetry
    var sendInterval = setInterval(function () {
      /*
      temperature += generateRandomIncrement();
      externalTemperature += generateRandomIncrement();
      humidity += generateRandomIncrement();
      o2 += generateRandomIncrement();
      co2 += generateRandomIncrement();
      airquality += generateRandomIncrement();*/

      temperature = generateRandomNumber(25, 40);
      externalTemperature = generateRandomNumber(10, 20);
      humidity = generateRandomNumber(0, 100);
      o2 = generateRandomNumber(75, 100);
      co2 = generateRandomNumber(50, 150);
      airquality = generateRandomNumber(0, 10);

      longitude += generateLongitudeLatitude(-180, 180, 3);
      latitude += generateLongitudeLatitude(0, 90, 3);

      var data = JSON.stringify({
        'DeviceID': deviceId,
        'Temperature': temperature,
        'Airquality': airquality,
        'Humidity': humidity,
        'ExternalTemperature': externalTemperature,
        'o2': o2,
        'co2': co2,
        'Longitude': longitude,
        'Latitude': latitude,
      });

      console.log('Sending device event data:\n' + data);
      client.sendEvent(new Message(data), printErrorFor('send event'));
    }, 5000);

    client.on('error', function (err) {
      printErrorFor('client')(err);
      if (sendInterval) clearInterval(sendInterval);
      client.close(printErrorFor('client.close'));
    });
  }
});