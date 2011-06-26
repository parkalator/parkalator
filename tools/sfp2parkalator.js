var sys = require('sys');
var fs = require('fs');


function sfp2parkalator(contents, time) {

    var o = JSON.parse(contents);
    if (o == null)
        throw "Couldn't parse file";
    var l = 0;
    var myrates = new Array();

    var mins = time2mins(time);
    //console.log("Mins is " + mins);

    var avls = o.AVL;
    for (i=0; i < avls.length; ++i) {
        if (typeof avls[i].BFID !== 'undefined') {
            var rates = avls[i].RATES.RS;
            for (j=0; j < rates.length; ++j) {
                rates[j].BEGMIN = timestrToMin(rates[j].BEG, 0);
                rates[j].ENDMIN = timestrToMin(rates[j].END, 1);

                if (rates[j].BEGMIN > mins ||
                    rates[j].ENDMIN < mins)
                    continue;

                rates[j].ID = avls[i].BFID;
                rates[j].NAME = avls[i].NAME;
                rates[j].OCC = avls[i].OCC;
                rates[j].OPER = avls[i].OPER;
                rates[j].LOC = avls[i].LOC;

                myrates[l++] = rates[j];
            }
        }
    }

    return myrates;
}

function time2mins(ts) {
    //var d = Date.parse(ts) / 1000;
    //return (d - (parseInt(d / 86400)*86400)) / (24*60); 
    var d = ts.match(/\w+ \w+ \d+ (\d+):(\d+)/);
    //console.log(d[1] + " and " + d[2]);
    return parseInt(d[1]) * 60 + parseInt(d[2]);
}


var doMunge  = function(err, contents) {
    if (err) throw err;
    var d = new Date();
    console.log(sfp2parkalator(contents, d.toLocaleString()));
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


fs.readFile(process.argv[2], doMunge);
//sys.puts(process.argv[1]);
