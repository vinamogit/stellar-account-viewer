
const buttonPubKey = document.getElementById('getPublicKey');
const fieldPubKey = document.getElementById('publicKey');
const divBalances = document.getElementById('balanceWrapper');
// const divClaimables = document.getElementById('claimablebalanceWrapper');
const divCreation = document.getElementById('creation');
// const inputNetwork = document.getElementById('network');
// const spanNetwork = document.getElementById('networkName');

// inputNetwork.checked = true;

const urlParams = new URLSearchParams(window.location.search);
let accountId = urlParams.get('accountId');
if (accountId) {
    fieldPubKey.value = accountId;
    this.loadAccount(accountId);
}

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


async function loadAccount(pubKey) {
    divBalances.innerHTML = "Loading...";
    divCreation.innerHTML = "";

    if (validateAccount(pubKey)) {
        loadBalances(pubKey);
    }

}

async function loadBalances(pubKey) {

    /*
    * Balances
    */
    let response = await fetch("https://horizon.stellar.org/accounts/" + pubKey);
    let data = await response.json();
    console.log(data)

    var model = {
        creation: {
            date: "",
            founder: ""
        },
        assets: [],
        evaluation: 0
    };

    for (var b of data.balances) {
        let asset = undefined;
        if (b.asset_code) {
            asset = b.asset_code + ':' + b.asset_issuer;
        } else {
            asset = "native";
        }

        if (!model.assets.includes(asset)) {
            model.assets.push(asset);
            // model[asset] = [];
        }

        let path = await findBestPath(asset, 1, "EURT:GAP5LETOV6YIE62YAM56STDANPRDO7ZFDBGSNHJQIYGGKSMOZAHOOS2S");
        // let avg = await getAveragePrice( "EURT:GAP5LETOV6YIE62YAM56STDANPRDO7ZFDBGSNHJQIYGGKSMOZAHOOS2S");
        // console.log(avg)

        model[asset] = {
            amount: b.balance,
            price: b.balance * path.amount,
            currency: "€"
        };
        model.evaluation += model[asset].price;
    }

    response = await fetch("https://horizon.stellar.org/accounts/" + pubKey + '/operations');
    data = await response.json();
    // console.log(data)

    for (var d of data._embedded.records) {
        if (d.type_i == 0 && d.account == pubKey) {
            model.creation = {
                date: d.created_at,
                funder: d.funder
            };
        }
    }

    drawBalances(model);
}

async function drawBalances(model) {

    console.log(model)

    async function draw(asset, code, image, balance) {

        // (async () => {


        // })();

        let table = "";
        // table += '<table style="text-align:left">';

        table += '<tr>';
        table += '<td rowspan="2">';
        table += '<img class="asset-img" id="' + asset + '"  src="' + image + '" />';
        table += '</td>';
        table += '<td>';
        table += Utils.formatAmount(balance.amount) + ' <span class="lighter">(' + Utils.formatAmount(balance.price, 2) + balance.currency + ')</span>';
        table += '</td>';
        table += '</tr>';

        table += '<tr>';
        table += '<td class="lighter">' + code + '</td>';
        table += '</tr>';

        // table += '</table>';

        return table;
    }

    var chartData = [];
    var chartLabels = [];
    if (model.native) {
        let  table = '<table style="text-align:left;vertical-align: middle;" class="tablecell">';
        table += await draw("XLM", "XLM", "./images/stellar-xlm-logo.png", model.native);
        table += '</table>';
        table += '<div class="chart-container tablecell" ><canvas id="chart" ></canvas></div>';

        for (var asset of model.assets) {

            if (asset == "native") {
                chartLabels.push("XLM");
            } else {
                var a = Utils.splitAsset(asset);
                chartLabels.push(a.code);
            }

            // chartData.push((model[asset].price / model.evaluation).toFixed(6));
            chartData.push((model[asset].price));
        }
        divBalances.innerHTML = table;

    }

    var div = '<div id="idTableOthers" style="display: none;">'

    div += '<table style="text-align:left" >';
    for (var asset of model.assets) {

        var assetObj = Utils.splitAsset(asset);
        if (assetObj.code != "native") {
            var asset_issuer = asset.substring(sepIndex + 1);
            div += await draw(asset, assetObj.code, "./images/generic.png", model[asset]);
        }
    }
    div += '</table>';
    div += '</div>';
    var othersHeader = '<h3><a href="#" onclick="toggleOthers()" style="display:block;text-decoration:none;color:inherit"><span id="toggle">►</span> Others (' + (model.assets.length - 1) + ')</a></h3>';

    divBalances.innerHTML += othersHeader + div;

    for (var asset of model.assets) {

        var sepIndex = asset.indexOf(':');
        var asset_code = asset.substring(0, sepIndex);
        if (asset_code) {
            var asset_issuer = asset.substring(sepIndex + 1);
            setAssetImage(asset_code, asset_issuer);
        }
    }


    /*
     * Created on
     */


    var createdAt = "Created at " + model.creation.date + ' by ';
    createdAt += '<a href="?accountId=' + model.creation.funder + '" >';
    createdAt += Utils.shortenKey(model.creation.funder);
    createdAt += '</a>';

    divCreation.innerHTML = createdAt;


    const data = {
        labels: chartLabels,
        datasets: [
          {
            label: 'Dataset 1',
            data: chartData,
            backgroundColor: [
                '#4dc9f6',
                '#f67019',
                '#f53794',
                '#537bc4',
                '#acc236',
                '#166a8f',
                '#00a950',
                '#58595b',
                '#8549ba'
              ]
          }
        ]
      };
    var ctx = 'chart';
    const config = {
        type: 'doughnut',
        data: data,
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
              display: false,
            },
            title: {
              display: true,
              text: Utils.formatAmount(model.evaluation, 2) + model.native.currency
            }
          }
        },
      };
    var myChart = new Chart(ctx, config);
}


function toggleOthers() {
    var div = document.getElementById("idTableOthers");
    var span = document.getElementById("toggle");
    if (div.style.display === "none") {
        div.style.display = "block";
        span.innerHTML = "▼";
    } else {
        div.style.display = "none";
        span.innerHTML = "►";
    }
}

async function setAssetImage(code, issuer) {

    var img = document.getElementById(code + ':' + issuer);
    if (code) {
        var image = await getAssetImage(code, issuer);
        if (image) {
            img.src = image;
        }
    } else {
        img.src = "./images/stellar-xlm-logo.png";
    }
}

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

    let response = await fetch("https://horizon.stellar.org/accounts/" + issuer);
    let data = await response.json();

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
    console.log("findBestPath " + amount)
    amount = parseFloat(amount).toFixed(7);
    var best = {
        amount: 0,
        path: []
    }

    var asset = Utils.splitAsset(asset);

    try {
        if (asset.code != "native") {
            let response = await fetch("https://horizon.stellar.org/assets?asset_code=" + asset.code + "&asset_issuer=" + asset.issuer + "&limit=1");
            let data = await response.json();
            if (data && data._embedded && data._embedded.records && data._embedded.records.length > 0) {
                var asset_type = data._embedded.records[0].asset_type;

                try {
                    response = await fetch("https://horizon.stellar.org/paths/strict-send?source_asset_type=" + asset_type + "&source_asset_code=" + asset.code + "&source_asset_issuer=" + asset.issuer + "&source_amount=" + amount + "&destination_assets=" + destination);
                    data = await response.json();
                    console.log(data)

                    if (data && data._embedded && data._embedded.records) {
                        for (var r of data._embedded.records) {
                            if (best.amount < parseFloat(r.destination_amount)) {
                                best = {
                                    amount: r.destination_amount,
                                    path: r.path
                                };
                            }
                        }
                    }
                } catch (e) {
                    console.log(e)
                }

            }
        } else {
            try {
                response = await fetch("https://horizon.stellar.org/paths/strict-send?source_asset_type=native&source_amount=" + amount + "&destination_assets=" + destination);
                data = await response.json();
                console.log(data)

                if (data && data._embedded && data._embedded.records) {
                    for (var r of data._embedded.records) {
                        if (best.amount < parseFloat(r.destination_amount)) {
                            best = {
                                amount: r.destination_amount,
                                path: r.path
                            };
                        }
                    }
                }
            } catch (e) {
                console.log(e)
            }
        }
    } catch (e) {
        console.log(e)
    }

    return best;
}

async function getAveragePrice(asset) {
    var asset = Utils.splitAsset(asset);
    var diff = 21600000;
    var end = new Date().getTime();
    var start = end - 21600000;

    console.log(start)
    console.log(end)
    try {
        response = await fetch("https://horizon.stellar.org/trade_aggregations?base_asset_type=native&counter_asset_code="+asset.code+"&counter_asset_issuer="+asset.issuer+"&counter_asset_type=credit_alphanum4&resolution=3600000&start_time="+start+"&end_time="+end
        );
        data = await response.json();
        console.log(data)

        if (data && data._embedded && data._embedded.records) {
            for (var r of data._embedded.records) {
                return data._embedded.records[0].avg;
            }
        }
    } catch (e) {
        console.log(e)
    }


    return 0;
}