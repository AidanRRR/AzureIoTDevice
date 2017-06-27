var crypto = require("crypto");

var endpoint = "VectrIoTHubTest.azure-devices.net/DummyDevice1/messages/events/";
var deviceKey = "oOXfLmeHlJwCqv7hBn9dH7k/wetaU7oYlQZPnrx97kE=";

var token = generateSasToken(endpoint, deviceKey, null, 60);

function generateSasToken(resourceUri, signingKey, policyName, expiresInMins) {
    resourceUri = encodeURIComponent(resourceUri);

    // Set expiration in seconds
    var expires = (Date.now() / 1000) + expiresInMins * 60;
    expires = Math.ceil(expires);
    var toSign = resourceUri + '\n' + expires;

    // Use crypto
    var hmac = crypto.createHmac('sha256', new Buffer(signingKey, 'base64'));
    hmac.update(toSign);
    var base64UriEncoded = encodeURIComponent(hmac.digest('base64'));

    // Construct autorization string
    var token = "SharedAccessSignature sr=" + resourceUri + "&sig=" +
        base64UriEncoded + "&se=" + expires;

    if (policyName) token += "&skn=" + policyName;
    return token;
}

console.log(token);