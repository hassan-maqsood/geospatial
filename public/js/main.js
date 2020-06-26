
mapboxgl.accessToken = 'pk.eyJ1IjoiaGFzc2FuMjIxYiIsImEiOiJja2JsNGxkMmwxNWh2MnltbG5hdmtkamt6In0.peFwhfyL96OUuiANBKYzMQ';

// var layerIDs = []; // Will contain a list used to filter against.
// var filterInput = document.getElementById('filter-input');

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [51.1657, 10.4515],
    zoom: 1
});


var points = [];

// Create a popup, but don't add it to the map yet.
var popup = new mapboxgl.Popup({
    closeButton: false
});

var filterEl = document.getElementById('feature-filter');
var listingEl = document.getElementById('feature-listing');

map.on('load', function() {

    map.addSource('points', {
        type: 'geojson',
        data: '/exercise/points/points.json'
    });

    map.addSource('states', {
        type: 'geojson',
        data: '/exercise/states/states.json'
    });

    map.addLayer({
        'id': 'points-layer',
        'type': 'circle',
        source: 'points'
    });

    map.addLayer({
        'id': 'states-layer',
        'type': 'fill',
        source: 'states',
        'paint': {
            'fill-color': '#088',
            'fill-opacity': 0.4,
            'fill-outline-color': 'rgba(200, 100, 240, 1)'
        }
    });

    // When a click event occurs on a feature in the states layer, open a popup at the
    // location of the click, with description HTML from its properties.
    map.on('click', 'states-layer', function(e) {
        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(
                "<h4>Number</h4>" +
                e.features[0].properties.number +
                "<h4>Color</h4>" +
                e.features[0].properties.color +
                "<h4>Area</h4>" +
                e.features[0].properties.area
            )
            .addTo(map);
    });

    map.on('mousemove', 'points-layer', function(e) {
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = 'pointer';

        // Populate the popup and set its coordinates based on the feature.
        var feature = e.features[0];
        popup
        .setLngLat(feature.geometry.coordinates)
        .setText(
            feature.properties.NAME_1 +
            ' (' +
            feature.properties.NAME_2 +
            ')'
        )
        .addTo(map);
    });

    // statesData.features.forEach(function(feature) {
    //     var symbol = feature.properties['number'];
    //     var layerID = 'poi-' + symbol;
    //
    //     // Add a layer for this symbol type if it hasn't been added already.
    //     if (!map.getLayer(layerID)) {
    //         map.addLayer({
    //             'id': layerID,
    //             'type': 'symbol',
    //             'source': 'states',
    //             'layout': {
    //                 'icon-image': symbol + '-15',
    //                 'icon-allow-overlap': true
    //             },
    //             'filter': ['==', 'icon', symbol]
    //         });
    //
    //         // Add checkbox and label elements for the layer.
    //         var input = document.createElement('input');
    //         input.type = 'checkbox';
    //         input.id = layerID;
    //         input.checked = true;
    //         filterGroup.appendChild(input);
    //
    //         var label = document.createElement('label');
    //         label.setAttribute('for', layerID);
    //         label.textContent = symbol;
    //         filterGroup.appendChild(label);
    //
    //         // When the checkbox changes, update the visibility of the layer.
    //         input.addEventListener('change', function(e) {
    //             map.setLayoutProperty(
    //                 layerID,
    //                 'visibility',
    //                 e.target.checked ? 'visible' : 'none'
    //             );
    //         });
    //     }
    // });

    // Change the cursor to a pointer when the mouse is over the states layer.
    map.on('mouseenter', 'states-layer', function() {
        map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', 'states-layer', function() {
        map.getCanvas().style.cursor = '';
    });

    map.on('moveend', function() {
        var featuresPoints = map.queryRenderedFeatures({ layers: ['points-layer'] });


        if (featuresPoints) {
            var uniqueFeatures2 = getUniqueFeatures(featuresPoints, 'NAME_1');

            // Populate features for the listing overlay.
            renderPointsListings(uniqueFeatures2);

            // Clear the input container
            filterEl.value = '';

            // Store the current features in sn `airports` variable to
            // later use for filtering on `keyup`.
            points = uniqueFeatures2;
        }
    });

    map.on('mouseleave', 'points-layer', function() {
        map.getCanvas().style.cursor = '';
        popup.remove();
    });


    function renderPointsListings(features) {
        var empty = document.createElement('p');
        // Clear any existing listings
        listingEl.innerHTML = '';
        if (features.length) {
            features.forEach(function(feature) {
                var prop = feature.properties;
                var item = document.createElement('a');
                item.textContent = prop.NAME_1 + ' (' + prop.NAME_2 + ')';
                item.addEventListener('mouseover', function() {
                    // Highlight corresponding feature on the map
                    popup
                        .setLngLat(feature.geometry.coordinates)
                        .setText(
                            feature.properties.NAME_1 +
                            ' (' +
                            feature.properties.NAME_2 +
                            ')'
                        )
                        .addTo(map);
                });
                listingEl.appendChild(item);
            });

            // Show the filter input
            filterEl.parentNode.style.display = 'block';
        } else if (features.length === 0 && filterEl.value !== '') {
            empty.textContent = 'No results found';
            listingEl.appendChild(empty);
        } else {
            empty.textContent = 'Drag the map to populate results';
            listingEl.appendChild(empty);

            // Hide the filter input
            filterEl.parentNode.style.display = 'none';

            // remove features filter
            map.setFilter('points-layer', ['has', 'NAME_1']);
        }
    }

    function normalize(string) {
        return string.trim().toLowerCase();
    }

    function getUniqueFeatures(array, comparatorProperty) {
        var existingFeatureKeys = {};
// Because features come from tiled vector data, feature geometries may be split
// or duplicated across tile boundaries and, as a result, features may appear
// multiple times in query results.
        var uniqueFeatures = array.filter(function(el) {
            if (existingFeatureKeys[el.properties[comparatorProperty]]) {
                return false;
            } else {
                existingFeatureKeys[el.properties[comparatorProperty]] = true;
                return true;
            }
        });

        return uniqueFeatures;
    }


    filterEl.addEventListener('keyup', function(e) {
        console.log('kk')
        var value = normalize(e.target.value);

        // Filter visible features that don't match the input value.
        var filtered = points.filter(function(feature) {
            var name = normalize(feature.properties.NAME_1);
            var code = normalize(feature.properties.NAME_2);
            return name.indexOf(value) > -1 || code.indexOf(value) > -1;
        });

        // Populate the sidebar with filtered results
        renderPointsListings(filtered);

        // Set the filter to populate features into the layer.
        if (filtered.length) {
            map.setFilter('points-layer', [
                'match',
                ['get', 'abbrev'],
                filtered.map(function(feature) {
                    return feature.properties.NAME_1;
                }),
                true,
                false
            ]);
        }
    });

    // Call this function on initialization
    renderPointsListings([]);
});