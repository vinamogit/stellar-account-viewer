

const buttonPubKey = document.getElementById('getPublicKey');
const fieldPubKey = document.getElementById('publicKey');

buttonPubKey.addEventListener('mousedown', async () => {
    if (freighter.isConnected()) {
        console.log("User has Freighter!");

        // let network = await retrieveNetwork();
        let pubKey = await retrievePublicKey();
        // console.log(network)
        // console.log("click " + pubKey)
        fieldPubKey.value = pubKey;
        // inputNetwork.checked = (network == "PUBLIC");
        // spanNetwork.innerHTML = network;
        reload();
    }
});

fieldPubKey.addEventListener('input', reload);

function reload() {
    if (validateAccount(fieldPubKey.value)) {
        window.location = "?accountId=" + fieldPubKey.value;
    }
    if (fieldPubKey.value.length > 0) {
        fieldPubKey.style['background-color'] = "red";
    } else {
        fieldPubKey.style['background-color'] = null;
    }
}

function validateAccount(pubKey) {
    if (!pubKey.startsWith('G')) {
        console.log("Key does not start with G");
        return false;
    }

    if (pubKey.length != 56) {
        console.log("Key size not correct " + pubKey.length)
        return false;
    }

    return true;
}


async function setAssetImage(code, issuer) {

    var imgs = document.getElementsByClassName(code + ':' + issuer);

    for (var img of imgs) {

        if (issuer) {
            var image = await getAssetImage(code, issuer);
            if (image) {
                img.src = image;
            }
        } else {
            img.src = "./images/stellar-xlm-logo.png";
        }
    }
}

/*
 * Get asset image from the stellar.toml of the home_domain
 */
async function getAssetImage(code, issuer) {

    async function fetchAssetImage(url) {
        let response = await fetch(url, { mode: 'cors' });
        let data = await response.text();
        var t = TOML.parse(data);
        if (t && t.CURRENCIES) {
            for (var c of t.CURRENCIES) {
                if (c.code == code && c.issuer) {
                    return c.image;
                }
            }
        }
        return undefined;
    }

    let data = await Horizon.accounts(issuer);

    let hd = data.home_domain;
    if (hd) {
        try {
            return await fetchAssetImage("https://" + hd + "/.well-known/stellar.toml");
        } catch (e) {
            console.log("Failed to load asset image from HTTPS");
            try {
                return await fetchAssetImage("http://" + hd + "/.well-known/stellar.toml");
            } catch (e) {
                console.log("Failed to load asset image from HTTP");
            }
        }
    }

    return undefined;
}