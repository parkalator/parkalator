var sys = require('sys');
var fs = require('fs');


function sfp2parkalator(contents, time) {

    var o = contents;
    if (o == null)
        throw "Couldn't parse file";
    var l = 0;
    var myrates = new Array();

    var mins = time2mins(time);
    //console.log("Mins is " + mins);

    var avls = o.AVL;
    //console.log(avls.length + " records found");
    for (i=0; i < avls.length; ++i) {
        if (typeof avls[i].BFID !== 'undefined') {
            var rates = avls[i].RATES.RS;
            //console.log("BFID " + avls[i].BFID + " " + rates.length + " rates found");
            //console.log(typeof avls[i].RATES.RS);
            if (typeof rates.length === 'undefined') {
                //console.log("BFID " + avls[i].BFID + " time is " + rates.BEG + " - " + rates.END);

                if (typeof rates.BEG === 'undefined')
                    continue;

                rates.BEGMIN = timestrToMin(rates.BEG, 0);
                rates.ENDMIN = timestrToMin(rates.END, 1);

                //console.log(" Time range " + rates.BEGMIN + " - " + rates.ENDMIN);
                if (rates.BEGMIN > mins ||
                    rates.ENDMIN < mins)
                    continue;

                rates.ID = avls[i].BFID;
                rates.NAME = avls[i].NAME;
                rates.OCC = avls[i].OCC;
                rates.OPER = avls[i].OPER;
                rates.LOC = avls[i].LOC;
                latlong = loc2LatLong(rates.LOC);
                rates.LOCBEG = { lat: parseFloat(latlong[1]), lng: parseFloat(latlong[0]) };
                rates.LOCEND = { lat: parseFloat(latlong[3]), lng: parseFloat(latlong[2]) };

                myrates[l++] = rates;

            } else {
                for (j=0; j < rates.length; ++j) {
                    rates[j].BEGMIN = timestrToMin(rates[j].BEG, 0);
                    rates[j].ENDMIN = timestrToMin(rates[j].END, 1);

                    //console.log("BFID " + avls[i].BFID + " Time range " + rates[j].BEGMIN + " - " + rates[j].ENDMIN);
                    if (rates[j].BEGMIN > mins ||
                        rates[j].ENDMIN < mins)
                        continue;

                    rates[j].ID = avls[i].BFID;
                    rates[j].NAME = avls[i].NAME;
                    rates[j].OCC = avls[i].OCC;
                    rates[j].OPER = avls[i].OPER;
                    rates[j].LOC = avls[i].LOC;

                    latlong = loc2LatLong(rates[j].LOC);
                    rates[j].LOCBEG = { lat: parseFloat(latlong[1]), lng: parseFloat(latlong[0]) };
                    rates[j].LOCEND = { lat: parseFloat(latlong[3]), lng: parseFloat(latlong[2]) };
                    //console.log("Lat " + latlong[0] + ", Lng" + latlong[1] + " - lat " + latlong[0] + ", lng " + latlong[1]);
                    myrates[l++] = rates[j];
                }
            }
        }
    }

    //console.log(l + " rates returned");
    return myrates;
}


function loc2LatLong(loc) {
    return loc.split(",");
}

function time2mins(ts) {
    //var d = Date.parse(ts) / 1000;
    //return (d - (parseInt(d / 86400)*86400)) / (24*60); 
    var d = ts.match(/\w+ \w+ \d+ (\d+):(\d+)/);
    //console.log(d[1] + " and " + d[2]);
    return parseInt(d[1]) * 60 + parseInt(d[2]);
}


var doMunge  = function(err, contents) {
    var d;

    if (err) throw err;

    if (fileName != null) {
        var toks = fileName.match(/.*\/sfpark (.*)\.json/);
        d = new Date(toks[1]);
    } else {
        d = new Date();
    }

    console.log(sfp2parkalator( JSON.parse(contents), d.toLocaleString()));
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

if (require.main === module)
{
	var fileName = process.argv[2];
	fs.readFile(fileName, doMunge);
}
//sys.puts(process.argv[1]);


exports.sfp2parkalator = sfp2parkalator;