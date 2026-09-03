'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { relativeTime } from '../lib/api';

const KMITL=[13.7291,100.7789];
const ANIMALS={DOG:{label:'สุนัขจรจัด',tone:'dog'},CAT:{label:'แมวจรจัด',tone:'cat'},OTHER:{label:'สัตว์จรจัด',tone:'other'}};

function animalSvg(type){
  const c='viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  if(type==='DOG')return `<svg ${c}><path d="M8 10c0-3.2 2.2-5.5 5.2-5.5 2.2 0 4.1 1.1 5.1 2.9h4.4l2.8 2.6-2.7 2.6h-4.2v3.8c0 2.8 1.4 5 4 6.4l2.2 1.2v3.5h-7v-5.8c-1.2.6-2.6.9-4.1.9-1.5 0-2.8-.3-3.9-.9v5.8H5.5V17c0-2.8.9-5.2 2.5-7Z"/><path d="M10.5 5.8 7 3.7v5.8M21.2 7.5v-3l3.2 2.8"/><circle cx="14.2" cy="9.2" r=".8"/></svg>`;
  if(type==='CAT')return `<svg ${c}><path d="m10 8-.8-4.2 4 2.3c.9-.3 1.8-.5 2.8-.5s1.9.2 2.8.5l4-2.3L22 8c1 1.1 1.6 2.6 1.6 4.2 0 3.4-3.2 5.8-7.6 5.8s-7.6-2.4-7.6-5.8c0-1.6.6-3.1 1.6-4.2Z"/><path d="M11.2 18.8c-1.8 2-2.7 4.8-2.7 8.2h8.2v-6.2c0 3.3 1.7 6.2 5.8 6.2h2.8c-2.8-1.3-3.8-3.9-3.8-7.2"/><circle cx="13" cy="11.5" r=".7"/><circle cx="19" cy="11.5" r=".7"/><path d="m14.7 14.2 1.3.8 1.3-.8"/></svg>`;
  return `<svg ${c}><circle cx="10" cy="9" r="2.2"/><circle cx="22" cy="9" r="2.2"/><circle cx="7" cy="15" r="2"/><circle cx="25" cy="15" r="2"/><path d="M16 13.2c-4 0-6.8 3.4-6.8 6.5 0 2.8 2.1 5.1 5 5.1.8 0 1.3-.4 1.8-.4s1 .4 1.8.4c2.9 0 5-2.3 5-5.1 0-3.1-2.8-6.5-6.8-6.5Z"/></svg>`;
}
function animalIcon(type,selected=false){const item=ANIMALS[type]||ANIMALS.OTHER;return L.divIcon({className:'mapMarkerHost',html:`<div class="mapAnimalMarker mapAnimalMarker--${item.tone}${selected?' isSelected':''}"><span class="mapAnimalLineIcon">${animalSvg(type)}</span><b></b></div>`,iconSize:[50,58],iconAnchor:[25,53],popupAnchor:[0,-50]});}
const userIcon=L.divIcon({className:'mapMarkerHost',html:'<div class="mapUserMarker"><span class="mapUserMarkerPulse"></span><span class="mapUserMarkerDot"></span></div>',iconSize:[36,36],iconAnchor:[18,18]});

function BoundsWatcher({onBoundsChange}){const map=useMapEvents({moveend:emit,zoomend:emit});function emit(){const b=map.getBounds();onBoundsChange({minLat:b.getSouth(),maxLat:b.getNorth(),minLng:b.getWest(),maxLng:b.getEast()});}useEffect(()=>{emit();},[]);return null;}
function LocateUser({position}){const map=useMap();useEffect(()=>{if(position)map.setView(position,Math.max(map.getZoom(),15),{animate:true});},[position,map]);if(!position)return null;return <Marker position={position} icon={userIcon} zIndexOffset={900} interactive={false}/>;}

export default function PawMap({points,onBoundsChange,userPosition}){
  const [selectedId,setSelectedId]=useState(null);
  return <MapContainer center={KMITL} zoom={14} className="mapCanvas pawMapCanvas" scrollWheelZoom zoomControl={false}>
    <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
    <ZoomControl position="bottomright"/>
    <BoundsWatcher onBoundsChange={onBoundsChange}/>
    <LocateUser position={userPosition}/>
    {points.map(point=>{const animal=ANIMALS[point.animalType]||ANIMALS.OTHER;const selected=selectedId===point.id;return <Marker key={point.id} position={[point.latitude,point.longitude]} icon={animalIcon(point.animalType,selected)} zIndexOffset={selected?500:0} eventHandlers={{click:()=>setSelectedId(point.id),popupclose:()=>setSelectedId(null)}}>
      <Popup className="pawPopup" closeButton={false} minWidth={238}>
        <div className="popupCard">
          <div className="popupTypeRow"><span className={`popupAnimalIcon popupAnimalIcon--${animal.tone}`} dangerouslySetInnerHTML={{__html:animalSvg(point.animalType)}}/><span>{animal.label}</span></div>
          <strong className="popupHeadline">ประมาณ {point.estimatedCount} ตัว</strong>
          <div className="popupData"><span>ให้อาหารล่าสุด</span><strong>{relativeTime(point.latestFeedingAt)}</strong></div>
          <Link className="popupAction" href={`/points/${point.id}`}>ดูรายละเอียด <span aria-hidden="true">→</span></Link>
        </div>
      </Popup>
    </Marker>;})}
  </MapContainer>;
}
