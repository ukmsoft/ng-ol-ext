import { Component, Input, ElementRef, OnInit, Host, Optional } from '@angular/core';
import { MapService } from '../map.service';
import { MapidService } from '../mapid.service';
import OlMap from 'ol/Map';
import EditBar from 'ol-ext/control/EditBar';
import ol_layer_Vector from 'ol/layer/Vector';
import ol_source_Vector from 'ol/source/Vector';
import { MapdataService } from '../mapdata.service';
import GeoJSON from 'ol/format/GeoJSON';
import { Polygon, LineString, Point } from 'ol/geom';
import Feature from 'ol/Feature';

/**
 * Add a control to the map
 * The control can be set inside the map (using parent id) or outside (using a mapId attribute)
 * @example
  <!-- Display a control inside a map -->
  <app-map>
    <app-control></app-control>
  </app-map>

  <!-- Display a control outside a map -->
  <app-control mapId="map"></app-control>
 */
@Component({
  selector: 'app-control',
  template: ''
})

export class ControlComponent implements OnInit {

  /** Map id
   */
  @Input() mapId: string;

  /** Define the service
   */
  constructor(
    private mapService: MapService,
    @Host()
    @Optional()
    private mapidService: MapidService,
    private mapdataService: MapdataService,
    private elementRef: ElementRef
  ) { }

  /** Add the control to the map
   */
  ngOnInit() {
    // Get the current map or get map by id
    const map: OlMap = this.mapService.getMap(this.mapidService || this.mapId);


    // Get the mapdataService
    const mapdataService: MapdataService = this.mapdataService;

    //  Vector layer
    var vector = new ol_layer_Vector( { source: new ol_source_Vector() })
    map.addLayer(vector);

    this.mapService.getMaskData().subscribe((maskData: any)=> {
      maskData.features.forEach(data => {
        if(data.geometry.hasOwnProperty('geometries')) {
          data.geometry.geometries.forEach(childData => {
            if(childData.type === 'Point') {
              vector.getSource().addFeature(new Feature(new Point(childData.coordinates)));
            } else if(childData.type === 'Polygon') {
              vector.getSource().addFeature(new Feature(new Polygon(childData.coordinates)));
            } else if(childData.type === 'Polygon') {
              vector.getSource().addFeature(new Feature(new LineString(childData.coordinates)));
            }
          })
        } else {
          if(data.geometry.type === 'Point') {
            vector.getSource().addFeature(new Feature(new Point(data.geometry.coordinates)));
          } else if(data.geometry.type === 'Polygon') {
            vector.getSource().addFeature(new Feature(new Polygon(data.geometry.coordinates)));
          } else if(data.geometry.type === 'Polygon') {
            vector.getSource().addFeature(new Feature(new LineString(data.geometry.coordinates)));
          }
        }
      });
    })

  // Vector callback
    vector.on('change', function(e){
    const geoJsonValue = new GeoJSON().writeFeatures(vector.getSource().getFeatures());
    mapdataService.updateData(geoJsonValue);
    });

  // Add the editbar
  var edit = new EditBar({ source: vector.getSource() });
  map.addControl(edit);
  }
}
