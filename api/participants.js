const express = require('express')
const axios = require('axios')
const app = express()
const port = 3000

const sheetID = "1tSMISVbPxIEHT2WVUWAj2A4_SFxTZMUmv_eE1YL1Ff0";
const googleSheetUrl = `https://spreadsheets.google.com/feeds/list/${sheetID}/1/public/values?alt=json`;
const indexAPI = 'https://independentspaceindex.at/spaces.json';

const checkResult = res => res.ok ? res.json() : Promise.resolve({});

const join = (spaces, events) => {
    let entries = [];
    events.forEach(event =>  {
        if (event.gsx$confirmed.$t !== "TRUE") return;
        
        let entry;
        let space = spaces.find(space => space.name === event.gsx$space.$t) // check if space is in index API
        if (space !== undefined) {
            entry = {
                space: space.name,
                address: space.address,
                district: space.district,
                website: space.website,
                events: [
                    {
                        title: event.gsx$title.$t,
                        start: event.gsx$startdate.$t,
                        end: event.gsx$enddate.$t,
                        description: event.gsx$description.$t,
                    }
                ]
            }
        }
        else {
            entry = {
                space: event.gsx$space.$t,
                address: event.gsx$address.$t,
                district: event.gsx$district.$t,
                website: event.gsx$website.$t,
            }
        }

        if (existingEntry = entries.find(prev => prev.space === entry.space)) {
            existingEntry.events.push(entry.events[0])
        }
        else entries.push(entry)
    })
    return entries
}

function getSpaces() {
    return axios.get(indexAPI);
}
  
function getEvents() {
    return axios.get(googleSheetUrl);
}

app.get('/api/participants', (req, res, next) => {
    Promise.all([getSpaces(), getEvents()])
    .then(([spacesData, eventsData]) => {
        console.log([spacesData.data, eventsData.data.feed.entry])
        res.json(join(spacesData.data, eventsData.data.feed.entry));
    })
    .catch(err => next(err));
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})