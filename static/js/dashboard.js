const { init, id } = window.instant;

var qtyValid = 0;
var qtyInvalid = 0;
var globalDB = null;
let timeLine = [];
let predictedValues = [];
let auxPredictedValues = [];
function syntaxHighlight(json) {
    if (typeof json !== 'string') {
        json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return `<span class="json-${cls}">${match}</span>`;
    });
}

$(document).ready(function () {
    initDB();

    $('#imageFile').change(function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                $('#imagePreview').attr('src', e.target.result).show();
                $('#noPreviewText').hide();
            }
            reader.readAsDataURL(file);
        } else {
            $('#imagePreview').attr('src', '').hide();
            $('#noPreviewText').show();
        }
    });

    $('#uploadForm').submit(function (event) {
        event.preventDefault();

        $('#card-upload-image').block({ message: "Cargando..." });
        $('#spinner-analisis').show();
        $('#card-result-analisis').hide();

        var formData = new FormData(this);

        $.ajax({
            url: '/process', // Replace with your Flask upload route
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                $('#card-upload-image').unblock();
                $('#spinner-analisis').hide();
                $('#card-result-analisis').show();
                // You can handle the response from the server here
                $('#imageProcessed').attr('src', 'data:image/png;base64,' + response.image).show();
                document.getElementById('processedText').innerHTML = syntaxHighlight(response.json);

                counts(response.json);

            },
            error: function (error) {
                alert('Error uploading image.');
                console.error(error);
            }
        });
    });

    function counts(json) {
        for (var i = 0; i < json.predictions.length; i++) {
            qtyValid++;
        }
        globalDB.transact(globalDB.tx.predictions[id()].create({
            qtyValid: qtyValid,
            qtyInvalid: qtyInvalid,
            predictions: json.predictions
        }));

        $('#qtyValidText').text(qtyValid);
    }
});

async function initDB() {
    globalDB = await init({ appId: instantdb_app_id });
    listenDB(globalDB);
    histogram();
}
function listenDB(instance) {
    console.log("LISTENING", instance);
    instance.subscribeQuery({ predictions: {} }, (resp) => {
        if (resp.error) {
            console.error(resp.error.message); // Pro-tip: Check you have the right appId!
            return;
        }
        if (resp.data) {
            const newRows = resp.data.predictions.slice(auxPredictedValues.length);

            predictedValues.forEach((row, index) => {
                if ( auxPredictedValues[index] ) {
                    // predictedValues[index] = auxPredictedValues[index].qtyValid;
                } else {
                    auxPredictedValues[index] = 0;
                }
            });
            newRows.forEach((row) => {
                auxPredictedValues.push(row.qtyValid);
            });
            //  = ;
            // for(var i = 0; i < auxPredictedValues.length; i++) {
            //     if (  )
            //     // predictedValues.push(auxPredictedValues[i].qtyValid);
            // }
        }
    });
}
function histogram() {
    Plotly.newPlot('histoDraw', [{
        x: timeLine,
        y: predictedValues,
        type: 'bar'
    }]);

    let t = timeLine.length;
    
    setInterval(() => {
        if (auxPredictedValues.length > t) {
            predictedValues.push(auxPredictedValues[t]);
        } else {
            predictedValues.push(0);
        }
        t++;
        timeLine.push(t);

        // console.log(predictedValues, "PR");
        // console.log(timeLine, "TM");
        Plotly.update('histoDraw', { y: [predictedValues], x: [timeLine] });
    }, 3000);
}

