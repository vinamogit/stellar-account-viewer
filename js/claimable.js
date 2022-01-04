/*
 *
 * LIQUIDITY POOLS
 * 
 */


var urlParams = new URLSearchParams(window.location.search);
let accountId = urlParams.get('accountId');
if (accountId) {
    fieldPubKey.value = accountId;
    loadAccount(accountId);

    var menu = document.getElementsByClassName("menu");
    for (var m of menu) {
        m.href += "?accountId=" + accountId + "&network=" + Horizon.network;
    }
}

async function loadAccount(pubKey) {
    let loading = document.getElementById("loading");
    loading.innerHTML = "Loading...";

    let start = new Date();
    if (validateAccount(pubKey)) {
        await loadClaimableBalances(pubKey);
    }
    loading.innerHTML = "";
    let end = new Date();

    console.log("Loading time: " + ((end - start) / 1000));
}

async function loadClaimableBalances(pubKey) {

    /*
    * Claimable balances
    */


    let data = await Horizon.claimableBalances(pubKey);
    console.log(data)

    if (data && data._embedded) {

        var records = data._embedded.records;

        if (records.length > 0) {

            var model = {
                assets: []
            };
            for (var entry of records) {

                var asset = entry.asset;
                if (!model.assets.includes(asset)) {
                    model.assets.push(asset);
                    model[asset] = [];
                }
                model[asset].push({
                    amount: entry.amount,
                    sponsor: entry.sponsor,
                    id: entry.id
                });

            }
            drawClaimableBalances(model);
        } else {
            // no claimabale balances
        }

    } else {
        if (data.status && data.status == 404) {
            document.getElementById("creation").innerHTML = "Account not found";
        } else {

            console.log(data)
        }
    }
}


async function drawClaimableBalances(model) {

    const defaultImage = "./images/generic.png";
    function draw(asset, image, balances) {

        var assetclass = "native";
        if (asset.issuer) {
            assetclass = asset.code + ':' + asset.issuer;
        }

        var table = "";
        var i = 0;
        for (var balance of balances) {
            table += '<tr>';
            if (i == 0) {
                table += '<td style="width:10em" rowspan="' + balances.length + '" ><img src="' + image + '" class="asset-img ' + assetclass + '" />' + asset.code + '</td>';
            }
            table += '<td style="width:10em">' + Utils.shortenKey(balance.sponsor) + '</td>';
            table += '<td style="width:10em;text-align:center">' + Utils.formatAmount(balance.amount) + '</td>';
            // table += '<td><button class="button-green">claim</button></td>';
            // table += '<td><button class="button-red">clean</button></td>';
            // if (balances.length > 1 && i == 0) {

            //     table += '<td style="width:10em" rowspan="' + balances.length + '" style="vertical-align:middle"><button class="button-green">claim all</button>&nbsp;<button class="button-red">clean all</button></td>';
            //     table += '<td  rowspan="' + balances.length + '" ><span id="best' + assetclass + '" ></span></td>';
            // } else {
            //     table += '<td style="width:10em" rowspan="' + balances.length + '" style="vertical-align:middle">&nbsp;</td>';
            //     table += '<td  rowspan="' + balances.length + '" ><span id="best' + assetclass + '" ></span></td>';
            // }
            table += '</tr>';

            i++;
        }

        return table;
    }

    var table = "";
    table += '<table style="width:fit-content;text-align:left" class="claim">';
    table += '<tr>';
    table += '<th></th>';
    table += '<th>sponsor</th>';
    table += '<th style="text-align:center">amount</th>';
    table += '<th></th>';
    table += '<th></th>';
    table += '<th></th>';
    // table += '<th>Clean up estimation</th>';
    table += '</tr>';
    if (model.native) {
        table += draw({ code: "XLM", issuer: null }, "./images/stellar-xlm-logo.png", model.native);
    }

    let promises = [];
    for (var asset of model.assets) {

        let a = Utils.splitAsset(asset);
        if (a.issuer) {

            table += draw(a, defaultImage, model[asset]);

            // let amount = 0;
            // for (var balance of model[asset]) {
            //     amount += parseFloat(balance.amount);
            // }
            // console.log(amount)
            // var best = findBestPath(asset, amount);
            // promises.push(best);

        }
    }
    table += '</table>';

    document.getElementById("claimablebalanceWrapper").innerHTML += table;

    

    // var basefee = 100;
    // var divisor = 10000000;
    // await Promise.all(promises).then((bests) => {
    //     for (var best of bests) {
    //         console.log(best)
    //         var asset = "native";
    //         if (best.asset.code) {
    //             asset = best.asset.code + ':' + best.asset.issuer;
    //         }
    //         console.log(asset)
    //         var fees = (3 + model[asset].length) * basefee; // change trust + N * cl_bal + path payment + change trust
    //         var finalamount = (best.amount - fees / divisor);
    //         if (finalamount > 0) {
    //             var path = '<img class="asset-img ' + best.asset.code + ':' + best.asset.issuer + '" src="./images/generic.png" />' + Utils.formatAmount(best.from);
    //             path += '&nbsp;➡&nbsp;...&nbsp;➡&nbsp;';
    //             path += '<img class="asset-img" src="./images/stellar-xlm-logo.png" />';
    //             //path += 'Clean up path: ' + best.from + " " + best.asset.code + " ➡ ";
    //             //path += 'Clean up path: ' + best.from + " " + best.asset.code + " ➡ ";
    //             // for (var p of best.path) {
    //             //     path += p.asset_code + " ➡ ";
    //             // }
    //             path +=  Utils.formatAmount(finalamount) ;
    //             document.getElementById("best" + asset).innerHTML += path;
    //         }
    //     }
    // });

    for (var asset of model.assets) {
        let a = Utils.splitAsset(asset);
        if (a.issuer) {
            setAssetImage(a.code, a.issuer);
        }
    }

    for (var asset of model.assets) {

        let a = Utils.splitAsset(asset);
        if (a.issuer) {




        }
    }

}