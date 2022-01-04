

const buttonPubKey = document.getElementById('getPublicKey');
const fieldPubKey = document.getElementById('publicKey');
const inputNetwork = document.getElementById('network');
const spanNetwork = document.getElementById('networkName');

var urlParams = new URLSearchParams(window.location.search);

var network = urlParams.get('network');
network = network?network:"PUBLIC";
Horizon.network = network;
inputNetwork.checked = (network == "PUBLIC");
spanNetwork.value = network;

buttonPubKey.addEventListener('mousedown', async () => {
    if (freighter.isConnected()) {
        console.log("User has Freighter!");

        let network = await retrieveNetwork();
        let pubKey = await retrievePublicKey();
        // console.log(network)
        // console.log("click " + pubKey)
        fieldPubKey.value = pubKey;
        inputNetwork.checked = (network == "PUBLIC");
        spanNetwork.innerHTML = network;
        reload();
    }
});

fieldPubKey.addEventListener('input', reload);

inputNetwork.addEventListener('input', value => {
    console.log(inputNetwork.checked)
    if (inputNetwork.checked) {
        spanNetwork.innerHTML = "PUBLIC";
    } else {
        spanNetwork.innerHTML = "TESTNET";
    }
    reload();
});

function reload() {
    if (validateAccount(fieldPubKey.value)) {
        window.location = "?accountId=" + fieldPubKey.value + "&network=" + spanNetwork.innerHTML;
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


async function findBestPath(asset, amount, destination = 'native') {
    amount = parseFloat(amount).toFixed(7);

    var best = {
        from: amount,
        amount: 0,
        path: [],
        asset: {}
    }

    var asset = Utils.splitAsset(asset);

    let type = "native";
    if (asset.code != "native") {
        let data = await Horizon.assets(asset.code, asset.issuer);
        if (data && data._embedded && data._embedded.records && data._embedded.records.length > 0) {
            type = data._embedded.records[0].asset_type;
        }
    }

    try {
        data = await Horizon.strictSend(type, (asset.code == "native") ? undefined : asset.code, asset.issuer, destination, amount);
        if (data && data._embedded && data._embedded.records) {

            // Probably the array is sorted and index 0 is the best
            for (var r of data._embedded.records) {
                if (best.amount < parseFloat(r.destination_amount)) {
                    best = {
                        from: amount,
                        amount: r.destination_amount,
                        path: r.path,
                        asset: asset
                    };
                }
            }
        }

    } catch (e) {
        console.log(e)
    }

    return best;
}