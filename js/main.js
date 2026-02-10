
require([
    // ===========  Library imports  ===========
    // No local esri folder needed as the arcgis js reference in Index.html points to the online version of the API, which includes all necessary modules
    "esri/config",
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/GeoJSONLayer",
    "esri/widgets/BasemapToggle",
    "esri/widgets/Search",
    "esri/layers/FeatureLayer"
], function (esriConfig, Map, MapView, GeoJSONLayer, BasemapToggle, Search, FeatureLayer) {

    // ===========  Map setup  ===========
    // Set the API Key - required for generating the basemap 
    esriConfig.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurHEe6Qt8vQLTcMOHhjjUcOai4zRm52zpqbe_N_Io0KCJpuysuvoS_olnWjiW179mACDnb9rx4YE52xtm9XyFT8EL0zO0CcS2Q8ThSeRVdiIn77HCPTkhBeuDLoWu4WVnMUNn_gSLqsdv5F4YaT027kncyF7J9ghq1MfHhr5dhuJmGDYh1AfR7l2GqbgV6VnG9wmXrUnmBRnOdzDvDR5FRXE.AT1_z8jiy4ia";

    // Initialize the map with a standard oceanic basemap
    const map = new Map({
        basemap: "arcgis-imagery-standard"
    });

    // Load the map into view
    const view = new MapView({
        container: "viewDiv",
        map: map,
        // Centered on Lake Simcoe
        center: [-79.37, 44.42], 
        zoom: 10
    });

    // ===========  Boundary lines  ===========
    // Handle cross-domain authentication betweeen the Esri API and the LIO boundary layer - LIO requests won't include any unnecessary tokens or credentials
    esriConfig.request.interceptors.push({
        urls: "https://ws.lioservices.lrc.gov.on.ca/",
        before: function(params) {
            params.requestOptions.query = params.requestOptions.query || {};
            params.requestOptions.query.token = null; // Keeps the LIO request clean
        }
    });

    // Add geographic boundary lines to identify Townships 
    const boundaryLayer = new FeatureLayer({
        url: "https://ws.lioservices.lrc.gov.on.ca/arcgis2/rest/services/LIO_OPEN_DATA/LIO_Open06/MapServer/1",
        renderer: {
            type: "simple",
            symbol: {
                type: "simple-fill",
                // Transparent fill - only the borders will be visible
                color: [0, 0, 0, 0], 
                outline: {
                    // Light gray border
                    color: [200, 200, 200, 0.4], 
                    width: 0.5
                }
            }
        },
        popupEnabled: false,
        listMode: "hide"
    });

    // Add the boundary lines to the map
    map.add(boundaryLayer);

    // ===========  Stock event data  ===========
    // Create the Ontario GeoHub layer - required for retrieving data from the Ontario GeoHub dataset
    const ontarioLayer = new GeoJSONLayer({
        // Local path to the GeoJSON file
        url: "./data/fish-stock-events.geojson", 
        popupTemplate: {
            title: "Location: {Official_Waterbody_Name}", 
            content: 
            `
                <ul>
                    <li><strong>Species:</strong> {Species}</li>
                    <li><strong>Year Stocked:</strong> {Stocking_Year}</li>
                    <li><strong>Number of Fish:</strong> {Number_of_Fish_Stocked}</li>
                    <li><strong>Township:</strong> {Geographic_Township}</li>
                </ul>

                <p><i>Data provided by the Ministry of Natural Resources and Forestry through Ontario GeoHub.</i></p>
            `
        }
    });

    // Add the data points to the map
    map.add(ontarioLayer);

    // ===========  Search widget  ===========
    const searchWidget = new Search({
        view: view,
        allPlaceholder: "Search waterbodies or species",
        includeDefaultSources: false,
        sources: [{
            name: "Ontario Fishing Holes",
            placeholder: "Ex: Simcoe",

            // Handle the list 'contains' population based on the user's input
            getSuggestions: (params) => {
                return ontarioLayer.queryFeatures().then((results) => {
                    // Create a 'search pattern' from what the user typed
                    const pattern = new RegExp(params.suggestTerm, "i"); 
                    
                    return results.features
                        .filter(f => {
                            const name = f.attributes.Official_Waterbody_Name;
                            const species = f.attributes.Species;
                            // Return true if the pattern exists ANYWHERE in name or species
                            return pattern.test(name) || pattern.test(species);
                        })
                        .map(f => ({
                            key: "name",
                            text: `${f.attributes.Official_Waterbody_Name} (${f.attributes.Species})`,
                            sourceIndex: params.sourceIndex
                        }));
                });
            },

            // Handle the map navigation when a list item is clicked
            getResults: (params) => {
                const lakeName = params.suggestResult.text.split(" (")[0];
                return ontarioLayer.queryFeatures({
                    where: `Official_Waterbody_Name = '${lakeName}'`,
                    returnGeometry: true,
                    outFields: ["*"]
                }).then(results => {
                    return results.features.map(f => ({ 
                        feature: f, 
                        name: f.attributes.Official_Waterbody_Name 
                    }));
                });
            }
        }]
    });

    // Use this listener to handle the bottom-center focus
    searchWidget.on("select-result", (event) => {
        const geom = event.result.feature.geometry;
        view.goTo({
            target: [geom.longitude, geom.latitude + 0.15],
            zoom: 10
        }, {
            duration: 1000,
            easing: "ease-in-out"
        });
    });

    // Add the search widget to the top-right corner of the view
    view.ui.add(searchWidget, "top-right");

    // ===========  Data-point click handling  ===========
    // Smoothly zoom to the clicked point on the map
    view.on("click", (event) => {
        view.hitTest(event).then((response) => {
            // Find if we clicked a point on our layer
            const dataPointClicked = response.results.find(res => res.graphic.layer === ontarioLayer);

            if (dataPointClicked) {
                view.goTo({
                    target: [dataPointClicked.graphic.geometry.longitude, dataPointClicked.graphic.geometry.latitude + 0.15],
                    zoom: 10
                }, {
                    // Smooth transition 
                    duration: 1000, 
                    easing: "ease-in-out"
                });
            }
        });
    });
});