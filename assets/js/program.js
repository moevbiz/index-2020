$(document).ready(function () {
    toFormat(document.querySelectorAll('.terrorize'));
});

// $(window).scroll(function() {
//     if ($('body').data('view') == "program") {
//         if ($(this).scrollTop() > 100) {
//             $('#header').fadeOut();
//           } else {
//             $('#header').fadeIn();
//           }
//     }
//   });  

document.addEventListener('click', function(e) {
    console.log(e.target)
    if (e.target.classList.contains('date-filter-single')) {
        dateView(e.target.dataset.date)
    }
    if (e.target.classList.contains('event__title')) {
        if (e.target.classList.contains('no-acc')) return;
        let accordion = document.querySelector(`[data-event-id="${e.target.parentElement.dataset.eventId}"]`).querySelector('.event__accord')
        if (accordion.style.maxHeight) {
            e.target.classList.remove('acc-open')
            accordion.style.maxHeight = null;
        } else {
            e.target.classList.add('acc-open')
            accordion.style.maxHeight = accordion.scrollHeight + 'px'
        }
    }
    if (e.target.classList.contains('date-filter-all')) {
        programView()
    }
})

const api = `api/participants`;

async function getData() {
    let response = await fetch(api);
    let data = await response.json()
    return data;
}

getData()
.then(data => init(data));

let events = [];
let participatingSpaces = [];
let jsonFeatures = [];
let markers = [];

function getSpace(spaceId) {
    return participatingSpaces.find(element => element.spaceId == spaceId)
}

function init(data) {
    // console.log(data)

    let elements = [];
    data.forEach(participant => {
        elements.push(makeDiv(participant))
        participatingSpaces.push(participant)
        var feature = {type: 'Feature',
                properties: participant,
                geometry: {
                    type: 'Point',
                    coordinates: [participant.lng, participant.lat]
                }
            };
        jsonFeatures.push(feature);
    })
    elements.forEach(element => {
        document.querySelector('.participants').insertAdjacentHTML('beforeend', element)
    })

    geojsonLayer = L.geoJson(jsonFeatures, {
        style: function(feature) {
            return {
                // color: '#ff0000'
            };
        },
        pointToLayer: function(feature, latlng) { 
            let marker = new L.marker(latlng, {
                icon: L.divIcon({
                    className: `marker-icon dates-${feature.properties.dates}${params.space && params.space != feature.properties.spaceId ? 'hidden' : ''}`,
                    html: `<span>${feature.properties.space}</span>`,
                    test: 'test'
                })
            })
            markers.push(marker)
            return marker
        },
        onEachFeature: function (feature, layer) {
            // layer.bindPopup(
            //     String(`<a href="${feature.properties.website}">${feature.properties.space}</a>` + '<br>' +
            //     feature.properties.address + ', ' + toPLZ(feature.properties.district) + ' Vienna<br>' +
            //     `<a href="${feature.properties.website}">${feature.properties.website}</a>`)
            // );
        }
    });

    map.addLayer(geojsonLayer);

    geojsonLayer.on("click", function (event) {
        var clickedMarker = event.layer;
        console.log(clickedMarker)
    });

    if (params.space) {
        spaceView(params.space)
    }
    if (params.date) {
        dateView(params.date)
    }

    document.getElementById('loader').style.display="none";

}

function makeDiv(participant) {
    let element = `
        <div class="participant 
        ${params.space && params.space != participant.spaceId ? 'hidden' : ''}
        ${params.date && !participant.dates.split('+').includes(params.date) ? 'hidden' : ''}"
        data-space-id="${participant.spaceId}"
        data-dates="${participant.dates}">
            <h3><span class="terrorize program-header program-header-inline"
                onclick="spaceView('${participant.spaceId}')"
                >${participant.space}</span></h3>
            <p>
            ${participant.address},
            ${formatDistrict(participant.district, 'plz')}
            <br>
            <a href="${participant.website}">${participant.website}</a>
            </p>
            ${Object.keys(participant.events).map(function (key) {
                event = participant.events[key]
                return `<div class="event" data-date="${event.start}" data-event-id="${event.id}">
                    <div class="event__date">October ${event.start}</div>
                    <div class="event__title ${event.description.length > 0 ? '' : 'no-acc'} ">${event.title}</div>
                    <div class="event__accord" data-event-id="${event.id}">${createTextLinks(event.description.replace(/(?:\r\n|\r|\n)/g, '<br>'))}</div>
                </div>`
            }).join("")}
        </div>
    `
    return element
}

function formatDistrict(district, format) {
    if (format == 'ordinal') return toOrdinalSuffix(district)
    if (format == 'plz') return toPLZ(district)
}

const toOrdinalSuffix = num => {
    const int = parseInt(num),
        digits = [int % 10, int % 100],
        ordinals = ['st', 'nd', 'rd', 'th'],
        oPattern = [1, 2, 3, 4],
        tPattern = [11, 12, 13, 14, 15, 16, 17, 18, 19];
    return oPattern.includes(digits[0]) && !tPattern.includes(digits[1])
        ? int + ordinals[digits[0] - 1]
        : int + ordinals[3];
}

const toPLZ = num => {
    if (num < 10) {
        num = `0${num}`
    }
    const PLZ = `1${num}0`
    return PLZ;
};

function duration(startDate, startTime, endDate, endTime) {
    start = new Date(startDate + ' ' + startTime)
    end = new Date(endDate + ' ' + endTime)
    if (start < end) {
        if (start.getDate() == end.getDate()) return `${start.getDate()}. October, ${start.getTime()} — ${end.getTime()}`
    }
}

const map = new L.Map('map', {
    zoomControl: false,
    zoomSnap: 0.5,
})
.setView([48.2082, 16.3738], 13)
.setActiveArea('activeArea', true);

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/256/{z}/{x}/{y}@2x?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'independentspaceindex/ckerm5tiz79eu19s6nti3hpvq',
    accessToken: 'pk.eyJ1IjoiaW5kZXBlbmRlbnRzcGFjZWluZGV4IiwiYSI6ImNrNW1tbjA5bDAza24zZXBkanFlc2ppcTQifQ.JnL1exWS78WBLlZrXn6BuQ'
}).addTo(map);



// views

function test() {
    console.log('test')
}

const spaceView = (spaceId) => {
    let divs = document.querySelectorAll('[data-space-id]')
    divs.forEach(div => {
        if (div.dataset.spaceId == spaceId) {
            div.classList.remove('hidden')
        } else {
            div.classList.add('hidden')
        }
    })

    if (participatingSpaces.length > 0) {
        let spaceCoords = [getSpace(spaceId).lat, getSpace(spaceId).lng]
        map.flyTo(spaceCoords, 15)
    }

    window.history.replaceState(null, null, `?space=${spaceId}`);

    document.body.dataset.view="space"
}

const dateView = (date) => {
    let divs = document.querySelectorAll('.event[data-date]')

    let dateBtns = document.querySelectorAll(`.filter[data-date]`)

    dateBtns.forEach(dateBtn => {
        if (dateBtn.dataset.date == date) {
            dateBtn.classList.add('selected-date')
        } else {
            dateBtn.classList.remove('selected-date')
        }
    })

    divs.forEach(div => {
        let dates = div.dataset.date
        dates = dates.split('+')
        if (dates.includes(date)) {
            div.classList.remove('hidden')
        } else {
            div.classList.add('hidden')
        }
    })

    document.querySelector('.date-filter-all').classList.remove('hidden')

    let parents = document.querySelectorAll('[data-space-id]')
    parents.forEach(parent => {
        let sel = (parent.querySelectorAll(`[data-date="${date}"`).length)
        if (sel > 0) {
            parent.classList.remove('hidden')
        }
        else { 
            parent.classList.add('hidden')
        }
    })

    markers.forEach(marker => {
        let mDates = marker.feature.properties.dates.split('+')
        if (mDates.includes(date)) {
            marker._icon.classList.remove('hidden')
        } else {
            marker._icon.classList.add('hidden')
        }
    })

    window.history.pushState(null, null, `?date=${date}`);

    document.body.dataset.view="date"
}

const programView = () => {
    let divs = document.querySelectorAll('.hidden')
    divs.forEach(div => {
        div.classList.remove('hidden')
    })
    document.querySelector('.date-filter-all').classList.add('hidden')

    document.body.dataset.view="program"
}


// params

var params = getSearchParameters();

function getSearchParameters() {
    var prmstr = window.location.search.substr(1);
    return prmstr != null && prmstr != "" ? transformToAssocArray(prmstr) : {};
}

function transformToAssocArray( prmstr ) {
    var params = {};
    var prmarr = prmstr.split("&");
    for ( var i = 0; i < prmarr.length; i++) {
        var tmparr = prmarr[i].split("=");
        params[tmparr[0]] = tmparr[1];
    }
    return params;
}

function createTextLinks(string) {
    let regex = /\{([^\}]*)\}/g;
    let newString = string.replace(regex, (_,m) => {
        const [title, link] = m.split(': ');
        return `<a href="${link}">${title}</a>`;
    });
    return newString;
}

window.onpopstate = function (event) {
    if (event.state) {
      // history changed because of pushState/replaceState
      console.log('state')
    } else {
      // history changed because of a page load
      if (params.space) {
        spaceView(params.space)
      } else if (params.date) {
        dateView(params.date)
      } else {
          programView()
      }
    }
  }
