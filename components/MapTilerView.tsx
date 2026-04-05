import React from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { maptiler_api } from "../app/service/maptiler_service";

type MapTilerProps = {
  center?: [number, number];
  zoom?: number;
  markers?: { id: string; lng: number; lat: number; emoji?: string }[];
};

export default function MapTilerView({ 
  center = [121.7270, 17.6186], // Default Tuguegarao
  zoom = 14, 
  markers = [] 
}: MapTilerProps) {
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://cdn.maptiler.com/maptiler-sdk-js/v2.3.0/maptiler-sdk.umd.js"></script>
        <link href="https://cdn.maptiler.com/maptiler-sdk-js/v2.3.0/maptiler-sdk.css" rel="stylesheet" />
        <style>
            body, html { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; background-color: #e8edea; }
            #map { position: absolute; top: 0; bottom: 0; width: 100%; }
            .emoji-marker { 
                font-size: 26px; 
                text-shadow: 0 3px 6px rgba(0,0,0,0.4); 
                transition: transform 0.2s;
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            maptilersdk.config.apiKey = '${maptiler_api}';
            
            const map = new maptilersdk.Map({
                container: 'map',
                style: maptilersdk.MapStyle.STREETS,
                center: [${center[0]}, ${center[1]}],
                zoom: ${zoom},
                geolocateControl: false,
                navigationControl: false
            });

            const markersData = ${JSON.stringify(markers)};
            markersData.forEach(m => {
                const el = document.createElement('div');
                el.className = 'emoji-marker';
                el.innerText = m.emoji || '📍';
                
                new maptilersdk.Marker({element: el})
                    .setLngLat([m.lng, m.lat])
                    .addTo(map);
            });
        </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView 
        source={{ html: htmlContent }} 
        style={styles.map}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e8edea" },
  map: { flex: 1, width: "100%", height: "100%", backgroundColor: "transparent" }
});
