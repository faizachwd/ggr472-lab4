/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
// Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoiZmFpemExMzIiLCJhIjoiY201d3E1Y2JwMDByYzJrb290MWltMTN1dyJ9.JsEiKVuT3vMCT8JQDlDA4g'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/faiza132/cm72f283a007a01quayc2g04v',  // ****ADD MAP STYLE HERE *****
    center: [-79.39, 43.65],  // starting point, longitude/latitude
    zoom: 11 // starting zoom level
});


/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/
// creating an empty variable
let collision;

// Fetch GeoJSON from URL and store response
fetch('https://raw.githubusercontent.com/faizachwd/ggr472-lab4/refs/heads/main/data/pedcyc_collision_06-21.geojson')
    .then(response => response.json())
    .then(response => {
        collision = response; // Store geojson as variable using URL from fetch response

        map.on('load', () => {

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

            console.log('hexdata', hexdata)

            let collishex = turf.collect(hexdata, collision, '_id', 'values');
            console.log('collishex', collishex)

            let maxcollis = 0;

            collishex.features.forEach((feature) => {
                feature.properties.COUNT = feature.properties.values.length
                if (feature.properties.COUNT > maxcollis) {
                    maxcollis = feature.properties.COUNT
                }
            });
            
            console.log('maxcollis',maxcollis)
            
            map.addSource('hexgrid', {
                type: 'geojson',
                data: collishex
            })

            map.addLayer({
                'id': 'hex_layer',
                'source': 'hexgrid',
                'type': 'fill',
                'paint': { 
                    "fill-color": [
                        "step",
                        ["get", "COUNT"],
                        "#D59967",
                        10, "#EE6055",
                        25, "#D59967",
                        maxcollis, ''
                    ],
                    "fill-opacity": 0.8
                },
                filter: ["!=", 'COUNT', 0],
            })

        });

    });


// creating a bounding box around the collision point data and scaling it up

/*--------------------------------------------------------------------
Step 4: AGGREGATE COLLISIONS BY HEXGRID
--------------------------------------------------------------------*/
//HINT: Use Turf collect function to collect all '_id' properties from the collision points data for each heaxagon
//      View the collect output in the console. Where there are no intersecting points in polygons, arrays will be empty



// /*--------------------------------------------------------------------
// Step 5: FINALIZE YOUR WEB MAP
// --------------------------------------------------------------------*/
//HINT: Think about the display of your data and usability of your web map.
//      Update the addlayer paint properties for your hexgrid using:
//        - an expression
//        - The COUNT attribute
//        - The maximum number of collisions found in a hexagon
//      Add a legend and additional functionality including pop-up windows


