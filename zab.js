function replaceCharacters(name) {
    var replacedName = name
        .replace(/Æ/g, 'AE')
        .replace(/æ/g, 'ae')
        .replace(/Ø/g, 'OE')
        .replace(/ø/g, 'oe')
        .replace(/Å/g, 'AA')
        .replace(/å/g, 'aa')
        // Replace any special character that is not a dash, dot, alphanumeric, or whitespace
        .replace(/[^a-zA-Z0-9\-. ]/g, '');

    return replacedName;
}


var params = JSON.parse(value);

var request = new HttpRequest();

request.addHeader('X-Cisco-Meraki-API-Key:' + params.token);
request.addHeader('User-Agent: ZabbixServer/1.1 Zabbix');

var response,
    error_msg = '',
    organizations = [],
    devices = [];

function getHttpData(url) {
    response = request.get(url);
    Zabbix.log(4, '[ Meraki API ] [ ' + url + ' ] Received response with status code ' + request.getStatus() + ': ' + response);

    if (response !== null) {
        try {
            response = JSON.parse(response);
        }
        catch (error) {
            throw 'Failed to parse response received from Meraki API. Check debug log for more information.';
        }
    }

    if (request.getStatus() !== 200) {
        if (response.errors) {
            throw response.errors.join(', ');
        } else {
            throw 'Failed to receive data: invalid response status code.';
        }
    }

    if (typeof (response) !== 'object' || response === null) {
        throw 'Cannot process response data: received data is not an object.';
    }

    return response;
};

try {

    if (params.token === '{' + '$MERAKI.TOKEN}') {
        throw 'Please change {' + '$MERAKI.TOKEN} macro to the proper value.';
    }

    if (params.url.indexOf('http://') === -1 && params.url.indexOf('https://') === -1) {
        params.url = 'https://' + params.url;
    }

    if (!params.url.endsWith('/')) {
        params.url += '/';
    }

    if (typeof params.httpproxy !== 'undefined' && params.httpproxy !== '') {
        request.setProxy(params.httpproxy);
    }

    organizations = getHttpData(params.url + 'organizations');
if (Array.isArray(organizations) && organizations.length > 0) {
        for (var i = 0; i < organizations.length; i++) {
            if (organizations[i].name) {
                // Replace characters in organization name
                organizations[i].name = replaceCharacters(organizations[i].name);
            }

            // Existing logic to fetch and process organization devices...
        }
    }
    if (Array.isArray(organizations) && organizations.length > 0) {
        for (i in organizations) {
            if ('id' in organizations[i]) {
                organization_devices = getHttpData(params.url + 'organizations/' + encodeURIComponent(organizations[i].id) + '/devices/statuses');

                if (Array.isArray(organization_devices) && organization_devices.length > 0) {
                    for (j in organization_devices) {
                        organization_devices[j].organizationId = organizations[i].id;
                        if (!organization_devices[j].name) {
                            organization_devices[j].name = organization_devices[j].serial;
                        }
                        devices.push(organization_devices[j]);
                    }
                }
            }
        }
    }

} catch (error) {
    error_msg = error;
};

return JSON.stringify({
    'organizations': organizations,
    'devices': devices,
    'error': error_msg.toString()
});

Zabbix.log(organizations);
