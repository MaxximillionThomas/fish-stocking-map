
require([
    // ===========  Library imports  ===========
    // No local esri folder needed as the arcgis js reference in Index.html points to the online version of the API, which includes all necessary modules
    "esri/config",
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/GeoJSONLayer",
    "esri/widgets/BasemapToggle",
    "esri/widgets/Search",
    "esri/layers/FeatureLayer",
    "esri/core/reactiveUtils"
], function (esriConfig, Map, MapView, GeoJSONLayer, BasemapToggle, Search, FeatureLayer, reactiveUtils) {

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

        // Initial state - starts off at zoom 10 with individual points visible
        featureReduction: null, 

        // Define how data points should look when clusters are NOT enabled (Zoom 10+)
        renderer: {
            type: "simple",
            symbol: {
                type: "simple-marker",
                size: 10,
                // Zoom 10+: show individual points in blue
                color: [34, 139, 34, 1], 
                outline: { color: "white", width: 1.2 }
            },
            visualVariables: [{
                type: "color",
                field: "cluster_count",
                stops: [
                    // Zoom 0-0: hide individual points and show clusters in green
                    { value: 1, color: [0, 0, 0, 0] }, 
                    { value: 2, color: "green" }       
                ]
            }]
        },

        // Information popups that appear when clicking on a data point
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

    // Define how data clusters should look and behave when enabled (Zoom 0-9)
    const clusterConfig = {
        type: "cluster",
        clusterRadius: "100px",
     
        // Size and color clusters based on the number of points they contain
        renderer: {
            type: "simple",
            symbol: {
                type: "simple-marker",
                color: "green",
                outline: { color: "white", width: 1 }
            },
            visualVariables: [
                // Dynamic sizing
                {
                    type: "size",
                    field: "cluster_count",
                    // This logic keeps small groups at your original size 
                    // Value corresponds to the number of data points in the cluster
                    stops: [
                        { value: 2, size: "20px" },   
                        { value: 10, size: "30px" }, 
                        { value: 50, size: "40px" },
                        { value: 100, size: "50px" },
                        { value: 300, size: "60px"},
                        { value: 500, size: "70px"}
                    ]
                },

                // Dynamic color
                {
                    type: "color",
                    field: "cluster_count",
                    stops: [
                        // Low count -> light green, High count -> dark green
                        { value: 2, color: [100, 200, 100, 0.9] },   
                        { value: 10, color: [50, 180, 50, 0.9] },   
                        { value: 50, color: [34, 139, 34, 0.9] },   
                        { value: 100, color: [0, 120, 0, 0.9] },     
                        { value: 300, color: [0, 80, 0, 0.9] },     
                        { value: 500, color: [0, 40, 0, 0.9] }
                    ]
                }
            ]
        },

        labelingInfo: [{
            labelExpressionInfo: { 
                // Only show the number if it's a sum of 2 or more
                expression: "IIf($feature.cluster_count > 1, $feature.cluster_count, '')" 
            },
            symbol: {
                type: "text",
                color: "white",
                font: { weight: "bold", size: "12px" }
            },
            labelPlacement: "center-center"
        }]
    };

    // ===========  Data-point click handling  ===========
    // 1. Set the viewing mode (clustered/invididual) based on zoom level 
    reactiveUtils.watch(
        () => view.zoom,
        (zoom) => {
            // Zoom 11 or below (further out): show green llusters
            if (zoom <= 11) {
                ontarioLayer.featureReduction = clusterConfig;
            // Zoom 12 or higher (closer in): show individual blue Points
            } else {
                ontarioLayer.featureReduction = null;
            }
        },
        { initial: true }
    );

    // 2. Zoom in when clicking on a cluster or data point
    // Click event: triggered when the user clicks anywhere on the map
    view.on("click", (event) => {
        // Hit test event: identifies which graphics were clicked on, returning details about them in the *response*
        view.hitTest(event).then((response) => {

            // If we click a GREEN CLUSTER (Aggregate)
            const cluster = response.results.find(res => res.graphic && res.graphic.isAggregate);
            if (cluster) {
                view.goTo({
                    // Zoom in 1 level (e.g., from 8 to 9) towards the cluster's center point
                    target: cluster.graphic.geometry,
                    zoom: view.zoom + 1 
                });
                return;
            }

            // If we click a BLUE DATA POINT
            const dataPoint = response.results.find(res => res.graphic.layer === ontarioLayer);
            if (dataPoint) {
                view.goTo({
                    // Zoom to level 10 and center slightly above the point for better visibility of the popup
                    target: [dataPoint.graphic.geometry.longitude, dataPoint.graphic.geometry.latitude + 0.05],
                    zoom: 12 
                }, {
                    // Smoothly zoom to the data point    
                    duration: 1000,
                    easing: "ease-in-out"
                });
            }
        });
    });

    // =========================================================
    // ==============  END ADDITIONAL CONFIG  ==================
    // =========================================================

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
                            // Does the query partially match the township, water-body name, or species?
                            const township = f.attributes.Geographic_Township;
                            const name = f.attributes.Official_Waterbody_Name;
                            const species = f.attributes.Species;
                            // Return true if the pattern exists ANYWHERE in name or species
                            return  pattern.test(township) || pattern.test(name) || pattern.test(species);
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
});