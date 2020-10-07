require('dotenv').config()
const slugify = require('slugify')

const express = require('express')
const axios = require('axios')
const app = express()
const port = 3000

const sheetID = process.env.GOOGLE_SHEET_ID;
const googleSheetUrl = `https://spreadsheets.google.com/feeds/list/${sheetID}/1/public/values?alt=json`;
const indexAPI = 'https://independentspaceindex.at/spaces.json';

const checkResult = res => res.ok ? res.json() : Promise.resolve({});

const join = (spaces, events) => {
    let entries = [];
    events.forEach((event, i) => {
        if (event.gsx$confirmed.$t !== "TRUE") return;
        
        let entry;
        let space = spaces.find(space => space.name === event.gsx$space.$t) // check if space is in index API
        if (space !== undefined) {
            entry = {
                space: space.name,
                spaceId: space.spaceId,
                address: space.address,
                district: space.district,
                website: space.website,
                lat: space.lat,
                lng: space.lng,
                dates: event.gsx$startdate.$t,
                events: [
                    {
                        title: event.gsx$title.$t,
                        start: event.gsx$startdate.$t,
                        end: event.gsx$enddate.$t,
                        description: event.gsx$description.$t,
                        id: i,
                    }
                ]
            }
        }
        else {
            entry = {
                space: event.gsx$space.$t,
                spaceId: slugify(event.gsx$space.$t, {lower: true, strict: true, locale: 'de'}),
                address: event.gsx$address.$t,
                district: event.gsx$district.$t,
                website: event.gsx$website.$t,
                lat: event.gsx$lat.$t,
                lng: event.gsx$lat.$t,
                dates: event.gsx$startdate.$t,
                events: [
                    {
                        title: event.gsx$title.$t,
                        start: event.gsx$startdate.$t,
                        end: event.gsx$enddate.$t,
                        description: event.gsx$description.$t,
                        id: i,
                    }
                ]
            }
        }

        if (existingEntry = entries.find(prev => prev.space === entry.space)) {
            existingEntry.events.push(entry.events[0])
            existingEntry.dates = existingEntry.dates + '+' + entry.events[0].start
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
        let result = join(spacesData.data, eventsData.data.feed.entry)
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate')
        res.json(result)
    })
    .catch(err => next(err));
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})