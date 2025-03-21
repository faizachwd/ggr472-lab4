// Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoiZmFpemExMzIiLCJhIjoiY201d3E1Y2JwMDByYzJrb290MWltMTN1dyJ9.JsEiKVuT3vMCT8JQDlDA4g'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/faiza132/cm72f283a007a01quayc2g04v',  // ****ADD MAP STYLE HERE *****
    center: [-79.3, 43.7],  // starting point, longitude/latitude
    zoom: 11 // starting zoom level
});

map.addControl(new mapboxgl.NavigationControl());

// creating an empty variable
let collision;

// Fetch GeoJSON from URL and store response
fetch('https://raw.githubusercontent.com/faizachwd/ggr472-lab4/refs/heads/main/data/pedcyc_collision_06-21.geojson')
    .then(response => response.json())
    .then(response => {
        collision = response; // Store geojson as variable using URL from fetch response

        map.on('load', () => {

            // disabling double click zoom because I use double click for interactivity
            map.doubleClickZoom.disable();


            let evnresult = turf.envelope(collision);
            let bbox = turf.transformScale(evnresult, 1.1);

            console.log('collision', collision)

            // accessing and store the bounding box coordinates as an array variable
            let bbox_coords = [
                bbox.geometry.coordinates[0][0][0],
                bbox.geometry.coordinates[0][0][1],
                bbox.geometry.coordinates[0][2][0],
                bbox.geometry.coordinates[0][2][1]
            ]

            console.log('bbox coord', bbox_coords)

            // using bounding box coordinates as argument in the turf hexgrid function
            let hexdata = turf.hexGrid(bbox_coords, 0.5, { units: "kilometers" });

            //creating hexagons and collecting how many collisons per hexagon
            let collishex = turf.collect(hexdata, collision, '_id', 'values');

            let maxcollis = 0;

            // finding max number of collisions
            collishex.features.forEach((feature) => {
                feature.properties.COUNT = feature.properties.values.length
                if (feature.properties.COUNT > maxcollis) {
                    maxcollis = feature.properties.COUNT
                    maxcollis_id = feature.properties._id
                }
            });

            // iterating over each feature in collishex using .map, and extracting the count to figure out colour grading
            console.log(new Set(collishex.features.map(f => f.properties.COUNT)));

            map.addSource('hexgrid', {
                type: 'geojson',
                data: collishex
            })

            map.addLayer({
                'id': 'hex_layer',
                'source': 'hexgrid',
                'type': 'fill',
                'paint': {
                    "fill-outline-color": 'white',
                    "fill-color": [
                        "step",
                        ["get", "COUNT"],
                        "#D4D29B", //1-4,
                        5, "#B6B254", // 5-9
                        10, "#F2BF40", // 10-19
                        20, "#E7A14D", //20-29
                        30, "#DA6E2F", // 30-39
                        40, "#B74D2A",// 40-49
                        50, "#AB2611",//50-54, because 55 is maxcollis but in any case it would be 50-maxcollis
                        maxcollis, "#761005"
                    ],
                    "fill-opacity": 0.9
                },
                filter: ["!=", "COUNT", 0]
            })

        });

    });

// Popup on click, and remove popup on second click
let popup = new mapboxgl.Popup()

//sets click status of hexagon to false
let popup_click = false

map.on('click', 'hex_layer', (e) => {
    //if the hexagon is being clicked for the first time, the popup will appear
    if (!popup_click) {
        map.getCanvas().style.cursor = 'pointer';
        popup
            .setLngLat(e.lngLat)
            .setHTML("<b>Number of Collisions:</b><br>" + e.features[0].properties.COUNT)
            .addTo(map);
        // setting popup_click = true so that next time the user clicks the map runs the else statement

        popup_click = true
    }
    // if popup_click = true, its already highlighting some hexagons so we want to undo that with this dblclick

    else {
        popup.remove
        //setting popup_click to false so the process can start again

        popup_click = false
    }
});


// Method that changes the hexagons displayed based on an event: upon clicking a point it hides all other points that do not have the same number of collisions
//sets dblclick status of a hexagon to false
let click_active = false;

map.on('dblclick', 'hex_layer', (e) => {
    if (e.features.length > 0) {
        //if the hexagon is being dbl clicked for the first time (click_active = false) then the map will filter to only features of that colour
        if (!click_active) {
            map.setFilter('hex_layer',
                ['==', ['get', 'COUNT'], e.features[0].properties.COUNT])
            // setting click_active = true so that next time the user dblclicks the map runs the else statement
            click_active = true
        }

        // if click_active = true, its already highlighting some hexagons so we want to undo that with this dblclick
        else {
            map.setFilter('hex_layer', ["!=", "COUNT", 0]);
            //setting click_active to false so the process can start again
            click_active = false
        }
    }
});

