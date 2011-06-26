var sys = require('sys');
var fs = require('fs');


var sfp2parkalator = function(err, contents) {
    if (err) throw err;
    var count = 0;

    var o = JSON.parse(contents);
    if (o == null)
        throw "Couldn't parse file";

    var avls = o.AVL;
    for (i=0; i < avls.length; ++i) {
        if (typeof avls[i].BFID !== 'undefined') {
            var rates = avls[i].RATES.RS;
            for (j=0; j < rates.length; ++j) {
                rates[j].ID = avls[i].BFID;
                rates[j].NAME = avls[i].NAME;
                rates[j].OCC = avls[i].OCC;
                rates[j].OPER = avls[i].OPER;
                rates[j].LOC = avls[i].LOC;

                rates[j].BEGMIN = timestrToMin(rates[j].BEG, 0);
                rates[j].ENDMIN = timestrToMin(rates[j].END, 1);
                console.log(rates[j]);
            }
        }
    }
}


function timestrToMin(timestr, end)
{
    //var d = new Date();
    //console.log("Incoming time: " + timestr);
    var time = timestr.match(/(\d+)(?::(\d\d))?\s*(P?)/);
    var t;
    //console.log(time[1] + " : " + time[2] + " : " + time[3]);
    if (time[3])
        t = ((parseInt(time[1]) + 12) * 60) + parseInt(time[2]);
    else
        t = ((time[1] === '12' ? 0 : time[1]) * 60) + parseInt(time[2]);

    if (end && t === 0)
        t = 24*60;

    return t;
    
/*
    d.setHours(parseInt(time[1]) - (time[3] ? 0 : 12) );
    d.setMinutes(parseInt(time[2]) || 0 );
    d.setSeconds(0);
    return d.toLocaleTimeString();
*/
}


fs.readFile(process.argv[2], sfp2parkalator);
//sys.puts(process.argv[1]);
