# **Fish Stocking Map** 
A data-driven GIS application for mapping fish restocking events across Ontario's waterbodies.

## Explore ##
[![Static Badge](https://img.shields.io/badge/View%20Map-Click_here-blue)](https://maxximillionthomas.github.io/fish-stocking-map/) 

## Overview
Powered by data from [Ontario GeoHub](https://geohub.lio.gov.on.ca/datasets/c725d683af734e6da7850fe0f0b73eb3_0/explore?location=44.793222%2C-78.190268%2C13),
this application generates a map of data points across Ontario where there have been stocking events (new fish being released into waterbodies, typically by the government). By visualizing over a decade of data, the application identifies hotspots where restocking is most frequent, helping users make data-backed decisions for their fishing expeditions.

## Key Features
- **Dynamic Data Points**: Summarizes thousands of data points into density-aware green clusters, which automatically disperse into individual events once the user reaches a predefined zoom level.
- **Multivariate Rendering**: Uses 6 distinct layers of cluster size and color intensity to represent the magnitude of stocking events, allowing for instant visual identification of major fishing hubs.
- **Smart Search**: Features a custom character-matching search process that allows users to find specific waterbodies, townships, or fish species without displaying duplicate results.
- **Optimized Navigation**: Custom navigation logic implements a bottom-center focal point when selecting data points, ensuring information popups never leak out of screen bounds.

## Technical Stack
**Frontend**: HTML5, CSS3, JavaScript.

**API & Libraries**:
- **ArcGIS Maps SDK for JavaScript (v4.28)**: Utilized for high-performance spatial rendering and feature reduction.
- **ArcGIS Imagery**: Provides high-resolution satellite basemap context for exploring remote waterbodies.
- **Ontario GeoHub (LIO)**: Integrated via FeatureLayers with custom request interceptors to handle cross-domain authentication.

*Note: This application utilizes an ArcGIS API Key for basemap rendering, and a local GeoJSON file for client-side data processing.*   

## Author
Maxximillion Thomas