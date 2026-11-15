/* Allocate the existing full-quality render size before the first room is shown. */
window.SceneRender={scale:1,prepare(actor,director){
 if(actor.__sceneRenderPrepared||new URLSearchParams(location.search).get('quality')!=='full')return;
 actor.__sceneRenderPrepared=true;const root=director.root,resize=root.resize,canvas=document.querySelector('#GameCanvas'),state=this;
 root.resize=function(w,h){state.scale=Math.max(1,Math.min(2,Math.sqrt(6000000/(w*h))));return resize.call(this,Math.round(w*state.scale),Math.round(h*state.scale));};
 root.resize(canvas.width,canvas.height);actor.cleanups.push(()=>{root.resize=resize;});
}};

;
/* Prepare saved portable props before the first room is built; no network or render work. */
window.SceneInventory={prepare(a,prebuilt=false){
 if(a.__sceneInventoryState)return a.__sceneInventoryState;
 const storageKey='belvedere-inventory-v1',catalog=new Map(),baseRooms=new Map(),groups=new Map();
 const portable=d=>d.interactive==='cup'||d.interactive==='read'&&/^(book|deskprop)-/.test(d.model);
 const keyFor=(room,id)=>room+'::'+id;
 for(const room of a.rooms){baseRooms.set(room.id,{items:[...room.items],blocks:[...room.blocks]});for(const d of room.items){const key=keyFor(room.id,d.id);catalog.set(key,{room:room.id,data:structuredClone(d)});if(portable(d)){d.interactive='cup';d.inventoryKey=key;d.inventoryRoot=true;}}}
 let records=[];
 try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null'),used=new Set();if(saved?.version===1&&Array.isArray(saved.items))for(const r of saved.items){
  if(!Array.isArray(r.members)||!r.members.length||r.members[0]!==r.key||!r.members.every(k=>catalog.has(k)&&portable(catalog.get(k).data)&&!used.has(k)))continue;
  const l=r.location,room=a.rooms.find(x=>x.id===l?.room);if(l?.type!=='bag'&&!(l?.type==='ground'&&room&&[l.x,l.y,l.z].every(Number.isFinite)&&l.y>-.5&&l.y<2&&l.x>room.bounds[0]&&l.x<room.bounds[1]&&l.z>room.bounds[2]&&l.z<room.bounds[3]))continue;
  r.members.forEach(k=>used.add(k));records.push({key:r.key,members:r.members,location:l});
 }}catch{}
 function itemData(record,member){const source=catalog.get(member).data,origin=catalog.get(record.key).data,l=record.location;
  const d={...structuredClone(source),id:'bag-'+encodeURIComponent(member),interactive:'cup',inventoryKey:record.key,inventoryRoot:member===record.key,x:l.x+source.x-origin.x,y:l.y+source.y-origin.y,z:l.z+source.z-origin.z};
  delete d.host;delete d.anchors;delete d.interactX;delete d.interactZ;delete d.insideOnly;return d;
 }
 function syncRooms(){const moved=new Set(records.flatMap(r=>r.members));for(const room of a.rooms){const base=baseRooms.get(room.id);room.items=base.items.filter(d=>!moved.has(keyFor(room.id,d.id)));room.blocks=base.blocks.filter(b=>!moved.has(keyFor(room.id,b.name)));for(const r of records)if(r.location.type==='ground'&&r.location.room===room.id)room.items.push(...r.members.map(k=>itemData(r,k)));}}

 syncRooms();return a.__sceneInventoryState={storageKey,catalog,baseRooms,records,portable,keyFor,itemData,syncRooms,prebuilt};
}};

;
window.staticSitTemplate={
 id:'girl-seat-clear-transition-v3-20261115',status:'candidate-not-approved',scale:0.45,
 images:{base:'../../../素材与制作资料/角色素材/少女坐姿-v3-清晰正背左.png',diagonal:'../../../素材与制作资料/角色素材/少女坐姿-v3-清晰斜向.png',transitionBase:'../../../素材与制作资料/角色素材/少女坐姿-v3-过渡正背左.png',transitionDiagonal:'../../../素材与制作资料/角色素材/少女坐姿-v3-过渡斜向.png'},
 poses:{
  S:{image:'base',rect:[0,0,512,1024],seatAnchor:[256,663]},
  N:{image:'base',rect:[512,0,512,1024],seatAnchor:[256,663]},
  W:{image:'base',rect:[1024,0,512,1024],seatAnchor:[288,667]},
  SW:{image:'diagonal',rect:[0,0,627,1254],seatAnchor:[367,833],sourceScale:0.76555},
  NW:{image:'diagonal',rect:[627,0,627,1254],seatAnchor:[358,847],sourceScale:0.76555}
 },
 directions:{S:{source:'S'},N:{source:'N'},W:{source:'W'},SW:{source:'SW'},NW:{source:'NW'},E:{source:'W',flipX:true},SE:{source:'SW',flipX:true},NE:{source:'NW',flipX:true}},
 transitionMs:{enter:360,exit:300},
 transitionPoses:{
  S:[{image:'transitionBase',rect:[0,0,296,887],seatAnchor:[147,615],sourceScale:1.5},{image:'transitionBase',rect:[0,887,296,887],seatAnchor:[147,578],sourceScale:1.5}],
  N:[{image:'transitionBase',rect:[296,0,295,887],seatAnchor:[147,615],sourceScale:1.5},{image:'transitionBase',rect:[296,887,295,887],seatAnchor:[147,578],sourceScale:1.5}],
  W:[{image:'transitionBase',rect:[591,0,296,887],seatAnchor:[245,613],sourceScale:1.5},{image:'transitionBase',rect:[591,887,296,887],seatAnchor:[205,576],sourceScale:1.5}],
  SW:[{image:'transitionDiagonal',rect:[0,0,443,887],seatAnchor:[300,641],sourceScale:1.08},{image:'transitionDiagonal',rect:[0,887,443,887],seatAnchor:[255,639],sourceScale:1.08}],
  NW:[{image:'transitionDiagonal',rect:[443,0,444,887],seatAnchor:[330,647],sourceScale:1.08},{image:'transitionDiagonal',rect:[443,887,444,887],seatAnchor:[275,646],sourceScale:1.08}]
 }
};

;
window.SceneActionAssets={
  "gold-a": {
    "name": "金发",
    "images": {
      "base": "/action-art/%E9%87%91%E5%8F%91-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E5%9D%90%E5%A7%BF%E6%AD%A3%E8%83%8C%E5%B7%A6.png",
      "diagonal": "/action-art/%E9%87%91%E5%8F%91-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E5%9D%90%E5%A7%BF%E6%96%9C%E5%90%91.png",
      "transitionBase": "/action-art/%E9%87%91%E5%8F%91-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E5%9D%90%E8%B5%B7%E8%BF%87%E6%B8%A1%E6%AD%A3%E8%83%8C%E5%B7%A6.png",
      "transitionDiagonal": "/action-art/%E9%87%91%E5%8F%91-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E5%9D%90%E8%B5%B7%E8%BF%87%E6%B8%A1%E6%96%9C%E5%90%91.png",
      "front": "/action-art/%E9%87%91%E5%8F%91-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E8%BA%BA%E5%8D%A7%E8%84%9A%E7%AB%AF.png",
      "side": "/action-art/%E9%87%91%E5%8F%91-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E8%BA%BA%E5%8D%A7%E4%BE%A7%E9%9D%A2.png",
      "utility": "/action-art/%E9%87%91%E5%8F%91-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E6%8B%BF%E5%8F%96%E6%94%BE%E4%B8%8B.png",
      "seatSide": "/action-art/%E9%87%91%E5%8F%91-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E5%9D%90%E5%A7%BF%E5%B7%A6%E4%BE%A7%E8%A1%A5%E5%85%A8.png",
      "seatBack": "/action-art/%E9%87%91%E5%8F%91-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E5%9D%90%E5%A7%BF%E8%83%8C%E9%9D%A2%E8%A1%A5%E5%85%A8.png"
    },
    "sizes": {
      "base": [
        1536,
        1024
      ],
      "diagonal": [
        1254,
        1254
      ],
      "transitionBase": [
        1024,
        1536
      ],
      "transitionDiagonal": [
        1024,
        1536
      ],
      "front": [
        1024,
        1536
      ],
      "side": [
        1774,
        887
      ],
      "utility": [
        1024,
        1536
      ],
      "seatSide": [
        1024,
        1536
      ],
      "seatBack": [
        1024,
        1536
      ]
    },
    "bounds": {
      "base": [
        {
          "rect": [
            0,
            0,
            512,
            1024
          ],
          "opaque": [
            36,
            130,
            484,
            942
          ]
        },
        {
          "rect": [
            512,
            0,
            512,
            1024
          ],
          "opaque": [
            14,
            131,
            511,
            937
          ]
        },
        {
          "rect": [
            1024,
            0,
            512,
            1024
          ],
          "opaque": [
            0,
            149,
            495,
            938
          ]
        }
      ],
      "diagonal": [
        {
          "rect": [
            0,
            0,
            627,
            1254
          ],
          "opaque": [
            77,
            152,
            601,
            1143
          ]
        },
        {
          "rect": [
            627,
            0,
            627,
            1254
          ],
          "opaque": [
            17,
            164,
            606,
            1130
          ]
        }
      ],
      "transitionBase": [
        {
          "rect": [
            0,
            0,
            341,
            768
          ],
          "opaque": [
            20,
            122,
            327,
            710
          ]
        },
        {
          "rect": [
            341,
            0,
            342,
            768
          ],
          "opaque": [
            13,
            117,
            313,
            712
          ]
        },
        {
          "rect": [
            683,
            0,
            341,
            768
          ],
          "opaque": [
            39,
            134,
            329,
            715
          ]
        },
        {
          "rect": [
            0,
            768,
            341,
            768
          ],
          "opaque": [
            20,
            131,
            328,
            667
          ]
        },
        {
          "rect": [
            341,
            768,
            342,
            768
          ],
          "opaque": [
            11,
            131,
            319,
            667
          ]
        },
        {
          "rect": [
            683,
            768,
            341,
            768
          ],
          "opaque": [
            8,
            140,
            329,
            672
          ]
        }
      ],
      "transitionDiagonal": [
        {
          "rect": [
            0,
            0,
            512,
            768
          ],
          "opaque": [
            122,
            67,
            485,
            754
          ]
        },
        {
          "rect": [
            512,
            0,
            512,
            768
          ],
          "opaque": [
            114,
            74,
            457,
            756
          ]
        },
        {
          "rect": [
            0,
            768,
            512,
            768
          ],
          "opaque": [
            124,
            50,
            482,
            719
          ]
        },
        {
          "rect": [
            512,
            768,
            512,
            768
          ],
          "opaque": [
            54,
            64,
            456,
            711
          ]
        }
      ],
      "front": [
        {
          "rect": [
            0,
            0,
            1024,
            1536
          ],
          "opaque": [
            54,
            132,
            967,
            1471
          ]
        }
      ],
      "side": [
        {
          "rect": [
            0,
            0,
            1774,
            887
          ],
          "opaque": [
            67,
            211,
            1713,
            772
          ]
        }
      ],
      "utility": [
        {
          "rect": [
            0,
            0,
            341,
            768
          ],
          "opaque": [
            17,
            129,
            330,
            719
          ]
        },
        {
          "rect": [
            341,
            0,
            342,
            768
          ],
          "opaque": [
            21,
            129,
            324,
            718
          ]
        },
        {
          "rect": [
            683,
            0,
            341,
            768
          ],
          "opaque": [
            3,
            130,
            327,
            716
          ]
        },
        {
          "rect": [
            0,
            768,
            341,
            768
          ],
          "opaque": [
            15,
            203,
            332,
            617
          ]
        },
        {
          "rect": [
            341,
            768,
            342,
            768
          ],
          "opaque": [
            30,
            175,
            334,
            618
          ]
        },
        {
          "rect": [
            683,
            768,
            341,
            768
          ],
          "opaque": [
            11,
            193,
            336,
            618
          ]
        }
      ],
      "seatSide": [
        {
          "rect": [
            0,
            0,
            1024,
            1536
          ],
          "opaque": [
            122,
            179,
            934,
            1404
          ]
        }
      ],
      "seatBack": [
        {
          "rect": [
            0,
            0,
            1024,
            1536
          ],
          "opaque": [
            152,
            93,
            871,
            1441
          ]
        }
      ]
    },
    "nativeHeightRatio": 0.912109375
  },
  "silver-a": {
    "name": "银红礼服",
    "images": {
      "base": "/action-art/%E9%93%B6%E7%BA%A2%E7%A4%BC%E6%9C%8D-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E5%9D%90%E5%A7%BF%E6%AD%A3%E8%83%8C%E5%B7%A6.png",
      "diagonal": "/action-art/%E9%93%B6%E7%BA%A2%E7%A4%BC%E6%9C%8D-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E5%9D%90%E5%A7%BF%E6%96%9C%E5%90%91.png",
      "transitionBase": "/action-art/%E9%93%B6%E7%BA%A2%E7%A4%BC%E6%9C%8D-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E5%9D%90%E8%B5%B7%E8%BF%87%E6%B8%A1%E6%AD%A3%E8%83%8C%E5%B7%A6.png",
      "transitionDiagonal": "/action-art/%E9%93%B6%E7%BA%A2%E7%A4%BC%E6%9C%8D-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E5%9D%90%E8%B5%B7%E8%BF%87%E6%B8%A1%E6%96%9C%E5%90%91.png",
      "front": "/action-art/%E9%93%B6%E7%BA%A2%E7%A4%BC%E6%9C%8D-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E8%BA%BA%E5%8D%A7%E8%84%9A%E7%AB%AF.png",
      "side": "/action-art/%E9%93%B6%E7%BA%A2%E7%A4%BC%E6%9C%8D-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E8%BA%BA%E5%8D%A7%E4%BE%A7%E9%9D%A2.png",
      "utility": "/action-art/%E9%93%B6%E7%BA%A2%E7%A4%BC%E6%9C%8D-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E6%8B%BF%E5%8F%96%E6%94%BE%E4%B8%8B.png"
    },
    "sizes": {
      "base": [
        1536,
        1024
      ],
      "diagonal": [
        1254,
        1254
      ],
      "transitionBase": [
        1024,
        1536
      ],
      "transitionDiagonal": [
        1024,
        1536
      ],
      "front": [
        1024,
        1536
      ],
      "side": [
        1774,
        887
      ],
      "utility": [
        1024,
        1536
      ]
    },
    "bounds": {
      "base": [
        {
          "rect": [
            0,
            0,
            512,
            1024
          ],
          "opaque": [
            70,
            143,
            465,
            956
          ]
        },
        {
          "rect": [
            512,
            0,
            512,
            1024
          ],
          "opaque": [
            46,
            141,
            459,
            951
          ]
        },
        {
          "rect": [
            1024,
            0,
            512,
            1024
          ],
          "opaque": [
            32,
            147,
            454,
            945
          ]
        }
      ],
      "diagonal": [
        {
          "rect": [
            0,
            0,
            627,
            1254
          ],
          "opaque": [
            98,
            168,
            585,
            1109
          ]
        },
        {
          "rect": [
            627,
            0,
            627,
            1254
          ],
          "opaque": [
            43,
            172,
            575,
            1102
          ]
        }
      ],
      "transitionBase": [
        {
          "rect": [
            0,
            0,
            341,
            768
          ],
          "opaque": [
            33,
            84,
            313,
            723
          ]
        },
        {
          "rect": [
            341,
            0,
            342,
            768
          ],
          "opaque": [
            23,
            83,
            313,
            721
          ]
        },
        {
          "rect": [
            683,
            0,
            341,
            768
          ],
          "opaque": [
            30,
            90,
            315,
            719
          ]
        },
        {
          "rect": [
            0,
            768,
            341,
            768
          ],
          "opaque": [
            30,
            87,
            320,
            692
          ]
        },
        {
          "rect": [
            341,
            768,
            342,
            768
          ],
          "opaque": [
            13,
            86,
            321,
            689
          ]
        },
        {
          "rect": [
            683,
            768,
            341,
            768
          ],
          "opaque": [
            14,
            94,
            312,
            688
          ]
        }
      ],
      "transitionDiagonal": [
        {
          "rect": [
            0,
            0,
            512,
            768
          ],
          "opaque": [
            132,
            65,
            466,
            755
          ]
        },
        {
          "rect": [
            512,
            0,
            512,
            768
          ],
          "opaque": [
            96,
            65,
            443,
            747
          ]
        },
        {
          "rect": [
            0,
            768,
            512,
            768
          ],
          "opaque": [
            110,
            65,
            475,
            707
          ]
        },
        {
          "rect": [
            512,
            768,
            512,
            768
          ],
          "opaque": [
            53,
            74,
            453,
            703
          ]
        }
      ],
      "front": [
        {
          "rect": [
            0,
            0,
            1024,
            1536
          ],
          "opaque": [
            43,
            115,
            977,
            1483
          ]
        }
      ],
      "side": [
        {
          "rect": [
            0,
            0,
            1774,
            887
          ],
          "opaque": [
            78,
            204,
            1694,
            764
          ]
        }
      ],
      "utility": [
        {
          "rect": [
            0,
            0,
            341,
            768
          ],
          "opaque": [
            26,
            102,
            315,
            690
          ]
        },
        {
          "rect": [
            341,
            0,
            342,
            768
          ],
          "opaque": [
            23,
            102,
            341,
            690
          ]
        },
        {
          "rect": [
            683,
            0,
            341,
            768
          ],
          "opaque": [
            0,
            102,
            330,
            690
          ]
        },
        {
          "rect": [
            0,
            768,
            341,
            768
          ],
          "opaque": [
            19,
            181,
            323,
            626
          ]
        },
        {
          "rect": [
            341,
            768,
            342,
            768
          ],
          "opaque": [
            6,
            183,
            309,
            625
          ]
        },
        {
          "rect": [
            683,
            768,
            341,
            768
          ],
          "opaque": [
            11,
            191,
            334,
            626
          ]
        }
      ]
    },
    "nativeHeightRatio": 0.859375
  },
  "white-a": {
    "name": "白玫瑰",
    "images": {
      "base": "/action-art/%E7%99%BD%E7%8E%AB%E7%91%B0-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E5%9D%90%E5%A7%BF%E6%AD%A3%E8%83%8C%E5%B7%A6.png",
      "diagonal": "/action-art/%E7%99%BD%E7%8E%AB%E7%91%B0-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E5%9D%90%E5%A7%BF%E6%96%9C%E5%90%91.png",
      "transitionBase": "/action-art/%E7%99%BD%E7%8E%AB%E7%91%B0-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E5%9D%90%E8%B5%B7%E8%BF%87%E6%B8%A1%E6%AD%A3%E8%83%8C%E5%B7%A6.png",
      "transitionDiagonal": "/action-art/%E7%99%BD%E7%8E%AB%E7%91%B0-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E5%9D%90%E8%B5%B7%E8%BF%87%E6%B8%A1%E6%96%9C%E5%90%91.png",
      "front": "/action-art/%E7%99%BD%E7%8E%AB%E7%91%B0-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E8%BA%BA%E5%8D%A7%E8%84%9A%E7%AB%AF.png",
      "side": "/action-art/%E7%99%BD%E7%8E%AB%E7%91%B0-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E8%BA%BA%E5%8D%A7%E4%BE%A7%E9%9D%A2.png",
      "utility": "/action-art/%E7%99%BD%E7%8E%AB%E7%91%B0-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E6%8B%BF%E5%8F%96%E6%94%BE%E4%B8%8B.png"
    },
    "sizes": {
      "base": [
        1536,
        1024
      ],
      "diagonal": [
        1254,
        1254
      ],
      "transitionBase": [
        1024,
        1536
      ],
      "transitionDiagonal": [
        1024,
        1536
      ],
      "front": [
        1024,
        1536
      ],
      "side": [
        1774,
        887
      ],
      "utility": [
        1024,
        1536
      ]
    },
    "bounds": {
      "base": [
        {
          "rect": [
            0,
            0,
            512,
            1024
          ],
          "opaque": [
            45,
            152,
            499,
            971
          ]
        },
        {
          "rect": [
            512,
            0,
            512,
            1024
          ],
          "opaque": [
            34,
            158,
            459,
            961
          ]
        },
        {
          "rect": [
            1024,
            0,
            512,
            1024
          ],
          "opaque": [
            12,
            161,
            465,
            968
          ]
        }
      ],
      "diagonal": [
        {
          "rect": [
            0,
            0,
            627,
            1254
          ],
          "opaque": [
            50,
            170,
            572,
            1135
          ]
        },
        {
          "rect": [
            627,
            0,
            627,
            1254
          ],
          "opaque": [
            31,
            175,
            579,
            1138
          ]
        }
      ],
      "transitionBase": [
        {
          "rect": [
            0,
            0,
            341,
            768
          ],
          "opaque": [
            31,
            96,
            322,
            726
          ]
        },
        {
          "rect": [
            341,
            0,
            342,
            768
          ],
          "opaque": [
            13,
            98,
            324,
            726
          ]
        },
        {
          "rect": [
            683,
            0,
            341,
            768
          ],
          "opaque": [
            42,
            94,
            313,
            726
          ]
        },
        {
          "rect": [
            0,
            768,
            341,
            768
          ],
          "opaque": [
            19,
            78,
            329,
            676
          ]
        },
        {
          "rect": [
            341,
            768,
            342,
            768
          ],
          "opaque": [
            7,
            79,
            328,
            672
          ]
        },
        {
          "rect": [
            683,
            768,
            341,
            768
          ],
          "opaque": [
            23,
            79,
            327,
            674
          ]
        }
      ],
      "transitionDiagonal": [
        {
          "rect": [
            0,
            0,
            512,
            768
          ],
          "opaque": [
            109,
            31,
            480,
            735
          ]
        },
        {
          "rect": [
            512,
            0,
            512,
            768
          ],
          "opaque": [
            102,
            30,
            468,
            734
          ]
        },
        {
          "rect": [
            0,
            768,
            512,
            768
          ],
          "opaque": [
            67,
            40,
            465,
            719
          ]
        },
        {
          "rect": [
            512,
            768,
            512,
            768
          ],
          "opaque": [
            64,
            42,
            480,
            724
          ]
        }
      ],
      "front": [
        {
          "rect": [
            0,
            0,
            1024,
            1536
          ],
          "opaque": [
            102,
            135,
            905,
            1479
          ]
        }
      ],
      "side": [
        {
          "rect": [
            0,
            0,
            1774,
            887
          ],
          "opaque": [
            89,
            203,
            1689,
            734
          ]
        }
      ],
      "utility": [
        {
          "rect": [
            0,
            0,
            341,
            768
          ],
          "opaque": [
            32,
            152,
            322,
            754
          ]
        },
        {
          "rect": [
            341,
            0,
            342,
            768
          ],
          "opaque": [
            23,
            149,
            316,
            756
          ]
        },
        {
          "rect": [
            683,
            0,
            341,
            768
          ],
          "opaque": [
            9,
            148,
            323,
            756
          ]
        },
        {
          "rect": [
            0,
            768,
            341,
            768
          ],
          "opaque": [
            51,
            195,
            326,
            643
          ]
        },
        {
          "rect": [
            341,
            768,
            342,
            768
          ],
          "opaque": [
            22,
            189,
            315,
            655
          ]
        },
        {
          "rect": [
            683,
            768,
            341,
            768
          ],
          "opaque": [
            5,
            192,
            331,
            651
          ]
        }
      ]
    },
    "nativeHeightRatio": 0.9078125
  },
  "red-a": {
    "name": "贝雷帽",
    "images": {
      "base": "/action-art/%E8%B4%9D%E9%9B%B7%E5%B8%BD-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E5%9D%90%E5%A7%BF%E6%AD%A3%E8%83%8C%E5%B7%A6.png",
      "diagonal": "/action-art/%E8%B4%9D%E9%9B%B7%E5%B8%BD-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E5%9D%90%E5%A7%BF%E6%96%9C%E5%90%91.png",
      "transitionBase": "/action-art/%E8%B4%9D%E9%9B%B7%E5%B8%BD-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E5%9D%90%E8%B5%B7%E8%BF%87%E6%B8%A1%E6%AD%A3%E8%83%8C%E5%B7%A6.png",
      "transitionDiagonal": "/action-art/%E8%B4%9D%E9%9B%B7%E5%B8%BD-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E5%9D%90%E8%B5%B7%E8%BF%87%E6%B8%A1%E6%96%9C%E5%90%91.png",
      "front": "/action-art/%E8%B4%9D%E9%9B%B7%E5%B8%BD-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E8%BA%BA%E5%8D%A7%E8%84%9A%E7%AB%AF.png",
      "side": "/action-art/%E8%B4%9D%E9%9B%B7%E5%B8%BD-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E8%BA%BA%E5%8D%A7%E4%BE%A7%E9%9D%A2.png",
      "utility": "/action-art/%E8%B4%9D%E9%9B%B7%E5%B8%BD-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E6%8B%BF%E5%8F%96%E6%94%BE%E4%B8%8B.png"
    },
    "sizes": {
      "base": [
        1536,
        1024
      ],
      "diagonal": [
        1254,
        1254
      ],
      "transitionBase": [
        1024,
        1536
      ],
      "transitionDiagonal": [
        1024,
        1536
      ],
      "front": [
        1024,
        1536
      ],
      "side": [
        1774,
        887
      ],
      "utility": [
        1024,
        1536
      ]
    },
    "bounds": {
      "base": [
        {
          "rect": [
            0,
            0,
            512,
            1024
          ],
          "opaque": [
            103,
            113,
            444,
            965
          ]
        },
        {
          "rect": [
            512,
            0,
            512,
            1024
          ],
          "opaque": [
            80,
            113,
            424,
            959
          ]
        },
        {
          "rect": [
            1024,
            0,
            512,
            1024
          ],
          "opaque": [
            26,
            113,
            450,
            960
          ]
        }
      ],
      "diagonal": [
        {
          "rect": [
            0,
            0,
            627,
            1254
          ],
          "opaque": [
            142,
            185,
            544,
            1137
          ]
        },
        {
          "rect": [
            627,
            0,
            627,
            1254
          ],
          "opaque": [
            67,
            207,
            494,
            1118
          ]
        }
      ],
      "transitionBase": [
        {
          "rect": [
            0,
            0,
            341,
            768
          ],
          "opaque": [
            51,
            95,
            309,
            757
          ]
        },
        {
          "rect": [
            341,
            0,
            342,
            768
          ],
          "opaque": [
            43,
            99,
            302,
            755
          ]
        },
        {
          "rect": [
            683,
            0,
            341,
            768
          ],
          "opaque": [
            29,
            100,
            309,
            757
          ]
        },
        {
          "rect": [
            0,
            768,
            341,
            768
          ],
          "opaque": [
            49,
            88,
            313,
            725
          ]
        },
        {
          "rect": [
            341,
            768,
            342,
            768
          ],
          "opaque": [
            42,
            96,
            306,
            723
          ]
        },
        {
          "rect": [
            683,
            768,
            341,
            768
          ],
          "opaque": [
            32,
            96,
            310,
            725
          ]
        }
      ],
      "transitionDiagonal": [
        {
          "rect": [
            0,
            0,
            512,
            768
          ],
          "opaque": [
            145,
            50,
            454,
            747
          ]
        },
        {
          "rect": [
            512,
            0,
            512,
            768
          ],
          "opaque": [
            84,
            60,
            407,
            741
          ]
        },
        {
          "rect": [
            0,
            768,
            512,
            768
          ],
          "opaque": [
            138,
            48,
            428,
            726
          ]
        },
        {
          "rect": [
            512,
            768,
            512,
            768
          ],
          "opaque": [
            76,
            60,
            397,
            712
          ]
        }
      ],
      "front": [
        {
          "rect": [
            0,
            0,
            1024,
            1536
          ],
          "opaque": [
            211,
            136,
            812,
            1485
          ]
        }
      ],
      "side": [
        {
          "rect": [
            0,
            0,
            1774,
            887
          ],
          "opaque": [
            122,
            218,
            1684,
            717
          ]
        }
      ],
      "utility": [
        {
          "rect": [
            0,
            0,
            341,
            850
          ],
          "opaque": [
            46,
            161,
            309,
            768
          ]
        },
        {
          "rect": [
            341,
            0,
            342,
            850
          ],
          "opaque": [
            34,
            158,
            294,
            770
          ]
        },
        {
          "rect": [
            683,
            0,
            341,
            850
          ],
          "opaque": [
            8,
            159,
            324,
            771
          ]
        },
        {
          "rect": [
            0,
            850,
            341,
            686
          ],
          "opaque": [
            54,
            125,
            302,
            570
          ]
        },
        {
          "rect": [
            341,
            850,
            342,
            686
          ],
          "opaque": [
            35,
            119,
            293,
            574
          ]
        },
        {
          "rect": [
            683,
            850,
            341,
            686
          ],
          "opaque": [
            5,
            122,
            331,
            571
          ]
        }
      ]
    },
    "nativeHeightRatio": 0.837890625
  },
  "blue-a": {
    "name": "少女",
    "images": {
      "utility": "/action-art/%E5%B0%91%E5%A5%B3-%E5%9C%BA%E6%99%AF%E5%8A%A8%E4%BD%9C-v1-%E6%8B%BF%E5%8F%96%E6%94%BE%E4%B8%8B.png"
    },
    "sizes": {
      "utility": [
        1024,
        1536
      ]
    },
    "bounds": {
      "utility": [
        {
          "rect": [
            0,
            0,
            341,
            768
          ],
          "opaque": [
            23,
            231,
            340,
            707
          ]
        },
        {
          "rect": [
            341,
            0,
            342,
            768
          ],
          "opaque": [
            0,
            229,
            301,
            707
          ]
        },
        {
          "rect": [
            683,
            0,
            341,
            768
          ],
          "opaque": [
            1,
            226,
            318,
            706
          ]
        },
        {
          "rect": [
            0,
            768,
            341,
            768
          ],
          "opaque": [
            22,
            243,
            314,
            589
          ]
        },
        {
          "rect": [
            341,
            768,
            342,
            768
          ],
          "opaque": [
            5,
            238,
            294,
            589
          ]
        },
        {
          "rect": [
            683,
            768,
            341,
            768
          ],
          "opaque": [
            1,
            237,
            317,
            589
          ]
        }
      ]
    },
    "nativeHeightRatio": 0.75
  }
};

;
/* Per-character complete-pose assets. Fetch only the requested action, retry failures. */
window.SceneActions=(()=>{
 const cache=new Map(),pending=new Map();
 async function load(id,kind){
  const key=id+':'+kind;if(cache.has(key))return cache.get(key);if(pending.has(key))return pending.get(key);
  const run=async()=>{
   const data=SceneActionAssets[id];if(!data)throw Error('此角色尚未配置场景动作');
   const {Texture2D,ImageAsset}=await System.import('cc');
   if(kind==='lieLegacy'&&id!=='blue-a')throw Error('旧版对照仅适用于蓝发少女');
   const blue=id==='blue-a',urls=kind==='lieLegacy'?{front:'/lie-pose.png',side:'/lie-pose.png'}:kind==='seat'?(blue?{base:'/seat-base.png',diagonal:'/seat-diagonal.png',transitionBase:'/seat-transition-base.png',transitionDiagonal:'/seat-transition-diagonal.png'}:Object.fromEntries(['base','diagonal','transitionBase','transitionDiagonal',...(data.images.seatSide?['seatSide','seatBack']:[])].map(k=>[k,data.images[k]]))):kind==='lie'?(blue?{front:'/lie-oblique-front.png',side:'/lie-oblique-side.png'}:{front:data.images.front,side:data.images.side}):{utility:data.images.utility};
   const textures={},sizes={};const results=await Promise.allSettled(Object.entries(urls).map(async([k,url])=>{const im=await new Promise((ok,no)=>{const image=new Image();image.onload=()=>ok(image);image.onerror=()=>no(Error('动作原画加载失败，请重试'));image.src=url;});const texture=new Texture2D();texture.image=new ImageAsset(im);texture.setFilters(1,1);textures[k]=texture;sizes[k]=[im.width,im.height];}));
   const failure=results.find(r=>r.status==='rejected');if(failure){Object.values(textures).forEach(t=>t.destroy());throw failure.reason;}
   const value={textures,sizes,data};cache.set(key,value);return value;
  };
  window.__simpleInteraction?.notice("正在准备动作…");
  const downloads=window.__tavernRoomController?.characterDownloads;
  const job=downloads?downloads.priority(run):run();pending.set(key,job);try{return await job;}finally{pending.delete(key);}
 }
 function nativeHeight(actor){return actor.figure.scale.x*SceneActionAssets[actor.characterId].nativeHeightRatio;}
 function seatConfig(actor){
  if(actor.characterId==='blue-a')return staticSitTemplate;
  const data=SceneActionAssets[actor.characterId],height=nativeHeight(actor),poses={},transitionPoses={};
  // Pelvis support in each complete drawing, not a percentage shared by costumes.
  // Long dresses use the hidden hip/thigh junction, never the trailing hem.
  const contact={
   'red-a':{S:[.50,.69],N:[.50,.69],W:[.60,.69],SW:[.61,.685],NW:[.59,.695]},
   'gold-a':{S:[.50,.675],N:[.50,.62],W:[.54,.66],SW:[.59,.66],NW:[.58,.66]},
   'silver-a':{S:[.52,.68],N:[.50,.69],W:[.58,.68],SW:[.59,.67],NW:[.58,.67]},
   'white-a':{S:[.54,.69],N:[.50,.69],W:[.58,.69],SW:[.58,.67],NW:[.57,.67]}
  }[actor.characterId];
  const make=(key,index,anchor,target)=>{const cell=data.bounds[key][index],[x,y,w,h]=cell.rect,[l,t,r,b]=cell.opaque;return{image:key,rect:cell.rect,seatAnchor:[w*anchor[0],h*anchor[1]],unit:height*target/(b-t+1)};};
  for(const [i,d]of ['S','N','W'].entries()){
   poses[d]=make('base',i,contact[d],.84);
   transitionPoses[d]=[make('transitionBase',i,[d==='W'?.59:.50,.66],.96),make('transitionBase',i+3,[d==='W'?.55:.50,.64],.88)];
  }
  for(const [i,d]of ['SW','NW'].entries()){
   poses[d]=make('diagonal',i,contact[d],.84);
   transitionPoses[d]=[make('transitionDiagonal',i,[.61,.67],.96),make('transitionDiagonal',i+2,[.57,.65],.88)];
  }
  if(data.images.seatSide){poses.W=make('seatSide',0,contact.W,.84);poses.N=make('seatBack',0,contact.N,.84);}
  if(actor.characterId==='red-a')for(const [i,d]of ['S','N','W'].entries())transitionPoses[d]=[make('transitionBase',i,[d==='W'?.72:.50,.71],.96),make('transitionBase',i+3,[d==='W'?.68:.50,.72],.88)];
  return{poses,transitionPoses,directions:staticSitTemplate.directions,transitionMs:{enter:420,exit:360}};
 }
 return{load,nativeHeight,seatConfig,state:()=>({loaded:[...cache.keys()],loading:[...pending.keys()]}),dispose(){cache.forEach(x=>Object.values(x.textures).forEach(t=>t.destroy()));cache.clear();}};
})();

;
/* Short authored full-body reach/bend clips. Inventory commits at the contact frame. */
(async()=>{
 while(!window.__tavernRoomController?.loaded||!window.__tavern?.state().entered)await new Promise(r=>setTimeout(r,100));
 const a=__tavernRoomController,{Node,Material,MeshRenderer,Vec4,gfx}=await System.import('cc');
 const node=new Node('Reach and lower complete pose');a.node.addChild(node);node.active=false;
 const renderer=node.addComponent(MeshRenderer);renderer.mesh=a.quadMesh;
 const material=new Material();material.initialize({effectAsset:a.actorEffect,defines:{USE_TEXTURE:true,USE_ALPHA_TEST:true},states:{rasterizerState:{cullMode:gfx.CullMode.NONE}}});renderer.setMaterial(material,0);renderer.shadowCastingMode=0;renderer.receiveShadow=0;
 for(const key of ['hairGain','skinGain','clothGain'])material.setProperty(key,new Vec4(1,1,1,1));
 let active=null,serial=0,last=null;
 function cancel(){serial++;if(!active)return;node.active=false;a.player.active=true;active=null;a.vel={x:0,z:0};a.motionStamp=performance.now();a.frameName='';a.drawFrame(0,false);a.animateFigure(0);}
 function draw(assets,row,direction,position,unit){
  const col=direction==='S'?0:direction==='N'?1:2,cell=assets.data.bounds.utility[row*3+col],[x,y,w,h]=cell.rect,[tw,th]=assets.sizes.utility,flip=direction==='E',vertical=unit/Math.cos(50*Math.PI/180),ax=w*.52,ay=cell.opaque[3];
  material.setProperty('mainTexture',assets.textures.utility);material.setProperty('tilingOffset',new Vec4((flip?-w:w)/tw,-h/th,(flip?x+w:x)/tw,(y+h)/th));const tint=a.actorMat.getProperty('mainColor');if(tint)material.setProperty('mainColor',tint);
  node.setScale(w*unit,h*vertical,1);node.setPosition(position.x+(w/2-(flip?w-ax:ax))*unit,.03+(ay-h/2)*vertical,position.z);node.active=true;a.player.active=false;
 }
 async function play(kind,target,commit){
  if(active||a.transitioning)return false;
  window.__seatTrial?.leave(true);window.__bedTrial?.wake(true);
  const token=++serial,character=a.characterId,room=a.room.id,position={...a.pos};active={kind,character,room,phase:'loading',committed:false};
  a.keys.clear();a.pad={x:0,z:0};a.vel={x:0,z:0};
  try{
   const assets=await SceneActions.load(character,'utility');if(token!==serial||a.characterId!==character||a.room.id!==room||a.transitioning)return false;
   const dx=(target?.x??position.x)-position.x,dz=(target?.z??position.z+1)-position.z,direction=Math.abs(dx)>Math.abs(dz)?(dx>0?'E':'W'):(dz<0?'N':'S');a.facing=direction;
   const floor=kind==='drop'||(target?.y??1)<.4,first=assets.data.bounds.utility[direction==='S'?0:direction==='N'?1:2],unit=SceneActions.nativeHeight(a)*.98/(first.opaque[3]-first.opaque[1]+1),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
   const duration=reduced?1:floor?680:520,start=performance.now();let committed=false,ok=false;
   while(token===serial&&a.characterId===character&&a.room.id===room&&!a.transitioning){
    const t=Math.min(1,(performance.now()-start)/duration);active.phase=t<.45?'reach':t<.72?'contact':'return';
    if(t>=.45&&!committed){committed=true;ok=commit()!==false;active.committed=ok;}
    if(t>=1){last={kind,character,room,committed:ok};return ok;}
    draw(assets,floor&&t>.24&&t<.78?1:0,direction,position,unit);
    await new Promise(requestAnimationFrame);
   }
   return false;
  }finally{if(token===serial)cancel();}
 }
 const advance=a.advanceMotion.bind(a);a.advanceMotion=function(){if(active){this.vel={x:0,z:0};this.motionStamp=performance.now();return;}return advance();};
 for(const name of ['setCharacter','finishArrival','disposeRoom']){const original=a[name].bind(a);a[name]=function(...args){cancel();return original(...args);};}
 const interact=a.interact.bind(a);a.interact=function(){if(!active)return interact();};
 a.cleanups.push(()=>{cancel();node.destroy();material.destroy();});
 window.__propAction={play,cancel,state:()=>({busy:!!active,visible:node.active,...active,last})};
})().catch(e=>console.error('Prop actions:',e));

;
/* Static poses only. Resolve direction relative to the camera, not world axes. */
globalThis.StaticSeatPose={
  directions:['S','SW','W','NW','N','NE','E','SE'],
  // Measured from the actual glTF support surfaces (local model units).
  // [seat height, hip forward offset, front edge]. Respect each instance's scale.
  supports:{
    'chair-v7-0':[.580,.10,.270], 'chair-v7-1':[.580,.10,.270],
    'chair-v7-2':[.463,.10,.255], 'chair-v7-4':[.520,.10,.270],
    'chair-v7-5':[.485,.10,.290],
    'sofa-v7-0':[.555,.15,.40], 'sofa-v7-1':[.555,.15,.40],
    'sofa-v7-2':[.555,.15,.40], 'sofa-v7-3':[.555,.15,.40],
    'sofa-v7-4':[.555,.15,.40], 'sofa-v7-5':[.555,.15,.40],
    'piano-v7-4':[.582,.08,.285], 'piano-v7-5':[.580,.10,.270],
    'bench':[.520,.10,.250]
  },
  contactGeometry({width,height,anchor,unit,yaw,seatHeight,front,hem=false}){
    const g={positions:[],normals:[],uvs:[],indices:[]},nx=24,ny=40,pitch=50*Math.PI/180,c=Math.cos(pitch),tan=Math.tan(pitch),f=Math.cos(yaw*Math.PI/180),[ax,ay]=anchor;
    const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
    for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
      const u=i/nx,v=j/ny,px=u*width,py=(1-v)*height,down=(py-ay)*unit;
      // Move only along the camera ray: the full drawing, colours and silhouette
      // stay exactly unchanged. Upper body stays inside the back/arm supports;
      // the hanging shins and skirt are outside the seat's front/near edge.
      const lower=smooth((down+.045)/.14),side=Math.sqrt(Math.max(0,1-f*f));
      let depth=.035+lower*(f*(front+.08)+side*(hem?.33:.075));
      let y=(ay-py)*unit/c+depth*tan;
      if(seatHeight+y<.015){depth+=(.015-seatHeight-y)/tan;y=.015-seatHeight;}
      g.positions.push((px-ax)*unit,y,depth);g.normals.push(0,0,1);g.uvs.push(u,v);
    }
    for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const k=j*(nx+1)+i;g.indices.push(k,k+1,k+nx+1,k+1,k+nx+2,k+nx+1);}
    return g;
  },
  resolve(character,relativeYaw){
    if(!Number.isFinite(relativeYaw))throw Error('A calibrated camera-relative yaw is required');
    const index=((Math.round(relativeYaw/45)%8)+8)%8;
    const direction=this.directions[index],mapping=character.directions[direction];
    if(!mapping)throw Error('Missing seated direction: '+direction);
    const pose=character.poses[mapping.source];
    return {...pose,direction,flipX:!!mapping.flipX,
      seatAnchor:mapping.flipX?[pose.rect[2]-pose.seatAnchor[0],pose.seatAnchor[1]]:[...pose.seatAnchor]};
  },
  draw(context,image,pose,seatX,seatY,scale){
    const [sx,sy,w,h]=pose.rect,[ax,ay]=pose.seatAnchor;
    scale*=pose.sourceScale||1;
    context.save();context.translate(seatX,seatY);context.scale(scale,scale);
    if(pose.flipX){context.translate(-ax,-ay);context.translate(w,0);context.scale(-1,1);context.drawImage(image,sx,sy,w,h,0,0,w,h);}
    else context.drawImage(image,sx,sy,w,h,-ax,-ay,w,h);
    context.restore();
  }
};

;
/* Local trial v3: clear full-pose sprites + short authored enter/exit clips. */
(async()=>{
 const wait=()=>new Promise(r=>setTimeout(r,100));
 try{
 while(!window.__tavernRoomController?.loaded||!window.__tavern?.state().entered)await wait();
 const actor=window.__tavernRoomController;
 const {Node,Vec3,Vec4,Material,MeshRenderer,Texture2D,ImageAsset,gfx,director,Director,utils}=await System.import('cc');
 const contactMeshes=new Map();
 let config=window.staticSitTemplate,textures={},sizes={};
 const figure=new Node('Static seated pose · candidate');actor.node.addChild(figure);const renderer=figure.addComponent(MeshRenderer);renderer.mesh=actor.quadMesh;
 const material=new Material();material.initialize({effectAsset:actor.actorEffect,defines:{USE_TEXTURE:true,USE_ALPHA_TEST:true},states:{rasterizerState:{cullMode:gfx.CullMode.NONE}}});renderer.setMaterial(material,0);renderer.shadowCastingMode=0;renderer.receiveShadow=0;figure.active=false;
 for(const key of ['hairGain','skinGain','clothGain'])material.setProperty(key,new Vec4(1,1,1,1));
 let seated=null,returnPosition=null,busy=false,scale=1.15,height=0,override=null,lastRoom='';
 const panel=document.createElement('details');panel.id='seat-trial-panel';panel.hidden=true;panel.open=false;panel.innerHTML=`<style>#seat-trial-panel{position:fixed;left:12px;top:78px;z-index:20001;width:250px;max-height:65vh;overflow:auto;padding:12px;border:1px solid #b89b64;border-radius:9px;background:#242a23ed;color:#eee6d7;font:13px/1.5 system-ui}#seat-trial-panel select,#seat-trial-panel button{color:inherit;background:#424939;border:1px solid #8e9976;border-radius:4px;padding:7px;font:inherit;margin:5px 0;max-width:100%}#seat-trial-panel select{width:100%}#seat-trial-panel label{display:block;margin-top:7px}#seat-trial-panel input[type=range]{width:100%}#seat-trial-panel p{font-size:12px;margin:6px 0;color:#c6cbb8}@media(max-width:600px){#seat-trial-panel{width:205px;top:58px;max-height:47vh;left:8px}}</style><summary>坐姿试放 · 切换家具</summary><select id="seat-room" aria-label="房间"></select><select id="seat-object" aria-label="家具"></select><select id="seat-slot" aria-label="座位"></select><button id="seat-use">坐到此座位</button> <button id="seat-leave">起身</button><select id="seat-direction" aria-label="坐姿方向"><option value="auto">跟随家具方向</option>${StaticSeatPose.directions.map(d=>`<option value="${d}">${({S:'正面',N:'背面',W:'左侧',E:'右侧',SW:'左前',SE:'右前',NW:'左后',NE:'右后'})[d]}</option>`).join('')}</select><label>整组尺寸 <input id="seat-scale" type="range" min="0.7" max="1.3" step="0.01" value="1.15"></label><label>坐面微调 <input id="seat-height" type="range" min="-0.20" max="0.20" step="0.01" value="0"></label><p id="seat-status">正在准备…</p><p>WASD / 摇杆起身移动，E坐下或起身。微调只在本次试放生效。五位角色共用家具坐点，右向完整镜像。</p>`;document.body.append(panel);
 const $=id=>panel.querySelector('#'+id),say=s=>{$('seat-status').textContent=s;actor.hint=s;};
 const seatThings=()=>actor.things.filter(t=>t.data.interactive==='seat');
 const anchors=t=>Object.keys(t.data.anchors?.local||{}).filter(k=>/^SeatAnchor/.test(k));
 function world(t,name){const p=t.data.anchors?.local?.[name];if(!p)throw Error('此家具缺少 '+name);t.node.updateWorldTransform();return Vec3.transformMat4(new Vec3(),new Vec3(...p),t.node.worldMatrix);}
 function exitPoint(t){if(!t.node.isValid)return null;const names=['ExitAnchor','ApproachAnchor'];for(const name of names){if(!t.data.anchors?.local?.[name])continue;const p=world(t,name);if(__tavern.fits(p.x,p.z))return{x:p.x,z:p.z};}if(returnPosition&&returnPosition.room===actor.room.id&&__tavern.fits(returnPosition.x,returnPosition.z))return{x:returnPosition.x,z:returnPosition.z};const p=t.node.worldPosition;for(let r=.45;r<2.5;r+=.15)for(let i=0;i<24;i++){const a=i*Math.PI/12,x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r;if(__tavern.fits(x,z))return{x,z};}return null;}
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 function releaseContactMeshes(){renderer.mesh=actor.quadMesh;contactMeshes.forEach(m=>m.destroy());contactMeshes.clear();}
 function finishLeave(force=false){if(!seated)return true;const exit=seated.room===actor.room.id?(seated.exit||exitPoint(seated.thing)):null;if(!exit&&!force){say('座位周围没有可用离座位置。');return false;}figure.active=false;releaseContactMeshes();actor.player.active=true;actor.reviewFrame=null;if(exit)actor.pos=exit;if(actor.seatCameraHold)actor.seatCameraHold.exitPosition={...actor.pos};actor.vel={x:0,z:0};actor.motionStamp=performance.now();actor.frameName='';actor.facing=({SW:'W',NW:'W',SE:'E',NE:'E'})[seated.pose]||seated.pose||actor.facing;seated=null;actor.drawFrame(0,false);actor.animateFigure(0);say('已起身，可继续移动。');return true;}
 function leave(force=false){if(!seated)return true;if(force||reducedMotion.matches)return finishLeave(force);if(seated.phase==='exit')return false;const exit=exitPoint(seated.thing);if(!exit){say('座位周围没有可用离座位置。');return false;}seated.exit=exit;seated.phase='exit';seated.stamp=performance.now();say('正在起身…');return false;}
 function displayedPose(yaw){const base=StaticSeatPose.resolve(config,yaw),frame=seated.progress<.38?0:seated.progress<.72?1:2;seated.frame=frame;if(frame===2)return base;const p=config.transitionPoses[config.directions[base.direction].source][frame];return {...p,flipX:base.flipX,direction:base.direction,seatAnchor:base.flipX?[p.rect[2]-p.seatAnchor[0],p.seatAnchor[1]]:[...p.seatAnchor]};}
 function updatePose(){if(!seated)return;const t=seated.thing,local=[...t.data.anchors.local[seated.slot]],support=StaticSeatPose.supports[t.data.model];
  if(support){local[1]=support[0];local[2]=support[1];}local[2]+=.14*(1-seated.progress);t.node.updateWorldTransform();const p=Vec3.transformMat4(new Vec3(),new Vec3(...local),t.node.worldMatrix),approach=t.data.anchors?.local?.ApproachAnchor?world(t,'ApproachAnchor'):Vec3.transformMat4(new Vec3(),new Vec3(0,0,1),t.node.worldMatrix),origin=t.node.worldPosition;const yaw=Math.atan2(-(approach.x-origin.x),approach.z-origin.z)*180/Math.PI;
  const pose=displayedPose(override===null?yaw:StaticSeatPose.directions.indexOf(override)*45);const[x,y,w,h]=pose.rect,[tw,th]=sizes[pose.image],unit=pose.unit?pose.unit*(scale/1.15):1.24/1024*(pose.sourceScale||1)*scale,[ax,ay]=pose.seatAnchor;
  material.setProperty('mainTexture',textures[pose.image]);material.setProperty('tilingOffset',new Vec4((pose.flipX?-w:w)/tw,-h/th,(pose.flipX?x+w:x)/tw,(y+h)/th));
  const actualYaw=override===null?yaw:StaticSeatPose.directions.indexOf(override)*45,front=support?(support[2]-support[1])*t.node.scale.z:.20;
  const key=JSON.stringify([actor.characterId,t.data.id,seated.frame,pose.direction,w,h,ax,ay,unit,height]);
  if(!contactMeshes.has(key))contactMeshes.set(key,utils.createMesh(StaticSeatPose.contactGeometry({width:w,height:h,anchor:[ax,ay],unit,yaw:actualYaw,seatHeight:p.y+height,front,hem:['silver-a','white-a'].includes(actor.characterId)})));
  renderer.mesh=contactMeshes.get(key);figure.setScale(1,1,1);
  figure.setPosition(p.x,p.y+height,p.z);figure.active=true;actor.player.active=false;actor.pos={x:p.x,z:p.z};actor.vel={x:0,z:0};seated.pose=pose.direction;seated.anchor=[p.x,p.y,p.z];
  const tint=actor.actorMat.getProperty('mainColor');if(tint)material.setProperty('mainColor',tint);
 }
 async function sit(t,slot){if(busy||!t||window.__propAction?.state().busy)return;const character=actor.characterId,room=actor.room.id;busy=true;try{const assets=await SceneActions.load(character,'seat');if(character!==actor.characterId||room!==actor.room.id||!t.node.isValid||actor.transitioning)return;config=SceneActions.seatConfig(actor);textures=assets.textures;sizes=assets.sizes;}catch(e){say(e.message);return;}finally{busy=false;}const a=anchors(t);if(!a.length){say('此家具还没有座位定位。');return;}if(seated&&!finishLeave())return;returnPosition={...actor.pos,room:actor.room.id};const exit=exitPoint(t);if(!exit){say('找不到安全离座点，暂不坐下。');return;}actor.keys.clear();actor.pad={x:0,z:0};actor.runToggle=false;if(window.__simpleInteraction?.ready){const rect=document.querySelector("#GameCanvas").getBoundingClientRect();actor.seatCameraHold={position:{...actor.camera.node.position},height:actor.camera.orthoHeight,room:actor.room.id,width:rect.width,viewportHeight:rect.height};}seated={thing:t,slot:slot||a[0],room:actor.room.id,phase:reducedMotion.matches?"seated":"enter",progress:reducedMotion.matches?1:0,stamp:performance.now()};refresh();panel.querySelector("#seat-object").value=t.data.id;fillSlots();panel.querySelector("#seat-slot").value=seated.slot;updatePose();panel.open=false;say(`${t.data.label} · ${seated.pose} · ${seated.slot}`);}
 function fillSlots(){const t=seatThings().find(t=>t.data.id===$('seat-object').value);$('seat-slot').replaceChildren(...(t?anchors(t):[]).map((key,i)=>new Option('座位 '+(i+1),key)));}
 function refresh(){if(lastRoom===actor.room.id)return;lastRoom=actor.room.id;$('seat-room').value=lastRoom;$('seat-object').replaceChildren(...seatThings().map(t=>new Option(t.data.label||t.data.model,t.data.id)));fillSlots();}
 $('seat-room').replaceChildren(...actor.rooms.filter(r=>r.items.some(i=>i.interactive==='seat')).map(r=>new Option(r.title,r.id)));
 $('seat-room').onchange=async()=>{if(busy)return;busy=true;try{leave(true);await __tavern.visit($('seat-room').value);refresh();say('选择家具后点“坐到此座位”。');}catch(e){say(e.message);}finally{busy=false;}};
 $('seat-object').onchange=fillSlots;$('seat-use').onclick=()=>sit(seatThings().find(t=>t.data.id===$('seat-object').value),$('seat-slot').value);$('seat-leave').onclick=()=>leave();
 $('seat-direction').onchange=()=>{override=$('seat-direction').value==='auto'?null:$('seat-direction').value;updatePose();if(seated)say(`${seated.thing.data.label} · ${seated.pose}`);};$('seat-scale').oninput=()=>{scale=Number($('seat-scale').value);updatePose();};$('seat-height').oninput=()=>{height=Number($('seat-height').value);updatePose();};
 const seatKey=e=>{if(!seated||e.repeat||e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement||e.target instanceof HTMLTextAreaElement)return;if(e.code==='KeyE'){e.preventDefault();e.stopImmediatePropagation();if(seated.phase==='exit'){seated.phase='enter';seated.stamp=performance.now();}else leave();}else if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))leave();};
 window.addEventListener('keydown',seatKey,true);actor.cleanups.push(()=>window.removeEventListener('keydown',seatKey,true)); const originalInteract=actor.interact.bind(actor);actor.interact=function(){if(seated){leave();return;}const t=this.nearest();if(t?.data.interactive==='seat'){void sit(t);return;}return originalInteract();};
 const originalAdvance=actor.advanceMotion.bind(actor);actor.advanceMotion=function(){if(seated){const moving=Math.hypot(this.pad.x,this.pad.z)>0||['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].some(k=>this.keys.has(k));if(moving&&seated.phase!=='exit')leave();this.motionStamp=performance.now();return;}return originalAdvance();};
 const originalCharacter=actor.setCharacter.bind(actor);actor.setCharacter=async function(...args){leave(true);try{return await originalCharacter(...args);}finally{leave(true);}};
 const originalArrival=actor.finishArrival.bind(actor);actor.finishArrival=function(...args){leave(true);return originalArrival(...args);};
 const originalSave=actor.savePosition.bind(actor);actor.savePosition=function(){if(seated)return;return originalSave();};
 const originalHUD=actor.updateHUD.bind(actor);actor.updateHUD=function(){originalHUD();if(seated){this.action.disabled=false;this.action.textContent='起身 · E';}else if(this.nearest()?.data.interactive==='seat')this.action.textContent='坐下 · E';};
 function sync(){if(!actor.isValid)return;refresh();if(!seated)return;if(!seated.thing.node.isValid){leave(true);return;}const now=performance.now(),dt=Math.min(100,Math.max(0,now-seated.stamp));seated.stamp=now;if(seated.phase==='enter'){seated.progress=Math.min(1,seated.progress+dt/config.transitionMs.enter);if(seated.progress===1){seated.phase='seated';say(seated.thing.data.label+' · 已坐稳');}}else if(seated.phase==='exit'){seated.progress=Math.max(0,seated.progress-dt/config.transitionMs.exit);if(seated.progress===0){finishLeave();return;}}updatePose();}
 director.on(Director.EVENT_AFTER_UPDATE,sync);
 actor.cleanups.push(()=>{director.off(Director.EVENT_AFTER_UPDATE,sync);panel.remove();figure.destroy();material.destroy();contactMeshes.forEach(m=>m.destroy());contactMeshes.clear();});
 window.__seatTrial={sit:async(id,slot)=>sit(seatThings().find(t=>t.data.id===id),slot),leave,refresh,state:()=>({character:actor.characterId,seated:!!seated,phase:seated?.phase||"standing",progress:seated?.progress??0,frame:seated?.frame,id:seated?.thing.data.id,slot:seated?.slot,direction:seated?.pose,anchor:seated?.anchor,scale,height,closeup:false,room:actor.room.id,position:{...actor.pos},figureActive:figure.active,standingActive:actor.player.active}),seats:()=>seatThings().map(t=>({id:t.data.id,label:t.data.label,slots:anchors(t)}))};

 refresh();const requested=new URLSearchParams(location.search).get('seat');const first=requested&&seatThings().find(t=>t.data.id===requested);if(first){$('seat-object').value=first.data.id;fillSlots();await sit(first);}
 }catch(e){console.error('Seat trial:',e);const note=document.createElement('p');note.style.cssText='position:fixed;top:80px;left:20px;z-index:30000;background:#402;color:white;padding:20px';note.textContent='坐姿试放加载失败：'+e.message;document.body.append(note);}
})();













;
/* Local game presentation: saved normal view, one menu and nearby-only actions. */
(async()=>{
 while(!window.__seatTrial)await new Promise(r=>setTimeout(r,100));
 const actor=window.__tavernRoomController,hud=actor.hud;
 const style=document.createElement('style');style.textContent=`
 #seat-trial-panel{display:none!important}
 #tavern-ui .eyebrow,#tavern-ui .status,#tavern-ui .help,#tavern-ui .door-markers{display:none!important}
 #tavern-ui .top{left:16px!important;top:16px!important;max-width:calc(100% - 110px)!important;background:none!important;padding:0!important}
 #tavern-ui h1{font:500 16px/1.5 system-ui!important;margin:0!important;text-shadow:0 1px 5px #000}
 #tavern-ui .note{display:none!important}
 #tavern-ui #game-menu{position:absolute;right:14px;top:12px;pointer-events:auto;z-index:10;color:#f0dfbf;font:14px/1.5 system-ui}
 #game-menu>summary{list-style:none;cursor:pointer;border:1px solid #b59a6670;background:#272a24db;border-radius:8px;padding:9px 15px;width:max-content;margin-left:auto}
 #game-menu>summary::-webkit-details-marker{display:none}
 #tavern-ui #game-menu .views{position:static!important;display:grid!important;grid-template-columns:1fr 1fr;gap:7px;width:260px;max-width:calc(100vw - 28px);max-height:65vh;overflow:auto;box-sizing:border-box;background:#252921f5;border:1px solid #aa946060;border-radius:10px;padding:12px;margin-top:8px;pointer-events:auto}
 #tavern-ui #game-menu:not([open]) .views{display:none!important}
 #tavern-ui #game-menu .views button{margin:0!important;font-size:13px;min-height:40px;padding:8px}
 #tavern-ui .waymap{top:65px!important}
 #tavern-ui #action[hidden],#tavern-ui #cycle-target[hidden]{display:none!important}
 #interaction-toast{position:absolute;left:50%;bottom:108px;transform:translateX(-50%);max-width:65%;padding:7px 12px;border-radius:7px;background:#24291fe6;color:#efdfc1;font:13px/1.5 system-ui;pointer-events:none}
 #interaction-toast[hidden]{display:none}
 `;hud.append(style);
 const menu=document.createElement('details');menu.id='game-menu';menu.innerHTML='<summary aria-label="打开游戏菜单">菜单</summary>';const views=hud.querySelector('.views');menu.append(views);hud.append(menu);
 // Keep existing feature handlers and lazy loaders; only collect their buttons.
 views.addEventListener('click',e=>{if(e.target.closest('button'))menu.open=false;});
 const panelOpen=()=>!!document.querySelector('[data-function-panel],.cs-root,.reentry-panel');
 const outside=e=>{if(!panelOpen()&&!e.target.closest('#game-menu,#tavern-quick-actions,#tavern-screen-actions,#tavern-menu-branches,#tavern-menu-panels,#zoom-panel'))menu.open=false;};document.addEventListener('pointerdown',outside);
 const escape=e=>{if(e.key==='Escape'&&menu.open&&!panelOpen()){menu.open=false;menu.querySelector('summary').focus();}};document.addEventListener('keydown',escape);
 hud.querySelector('[data-map="hide"]')?.click();
 const toast=document.createElement('div');toast.id='interaction-toast';toast.hidden=true;toast.setAttribute('role','status');hud.append(toast);let toastTimer;
 function notice(text){toast.textContent=text;toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.hidden=true,2200);}
 function classify(){for(const t of actor.things)if(t.data.interactive==='read'&&/^(book|deskprop)-/.test(t.data.model))t.data.interactive='cup';}
 classify();
 const oldNearby=actor.nearby.bind(actor);
 actor.nearby=function(){if(this.carrying)return [this.carrying];return oldNearby().filter(t=>{
  const pickup=t.data.interactive==='cup';const p=pickup?t.node.worldPosition:{x:t.data.interactX??t.data.x,z:t.data.interactZ??t.data.z};
  return Math.hypot(p.x-this.pos.x,p.z-this.pos.z)<(pickup?.85:t.data.interactive==='bed'?.75:t.data.interactive==='seat'?1.25:1.1);
 });};
 const oldHUD=actor.updateHUD.bind(actor);actor.updateHUD=function(){oldHUD();const sitting=__seatTrial.state().seated,t=this.nearest();this.action.hidden=!sitting&&(!t||t.data.interactive==='portal');this.cycle.hidden=sitting||this.nearby().length<2;if(t?.data.interactive==='cup'&&!sitting)this.action.textContent=this.carrying===t?'放回 · E':'拿取 · E';};
 const oldInteract=actor.interact.bind(actor);actor.interact=function(){if(this.transitioning||this.passwordDialog)return;const t=this.nearest(),sitting=__seatTrial.state().seated;oldInteract();if(t?.data.interactive==='cup'&&!sitting)notice(this.hint);};
 const viewKey='belvedere-view-mode-v1';let savedOverview=false;
 // The overview toggle was removed at the user's request; retain the normal camera and saved zoom.
 function saveView(){savedOverview=actor.overview;try{localStorage.setItem(viewKey,savedOverview?'overview':'follow');}catch{}}
 const oldArrival=actor.finishArrival.bind(actor);actor.finishArrival=function(...args){const result=oldArrival(...args);classify();this.seatCameraHold=null;this.overview=savedOverview;this.reviewFrame=null;this.updateCamera(1);return result;};
 const oldReset=actor.reset.bind(actor);actor.reset=function(){__seatTrial.leave(true);oldReset();this.seatCameraHold=null;this.overview=savedOverview;this.reviewFrame=null;this.updateCamera(1);};
 actor.toggleView=function(){};hud.querySelector('#view')?.remove();
 const zoomButton=hud.querySelector('#zoom-toggle'),oldZoomClick=zoomButton.onclick;
 zoomButton.onclick=function(e){actor.seatCameraHold=null;oldZoomClick.call(this,e);saveView();};
 // Native zoom control already saves belvedere-view-zoom-v1; keep that existing value.
 const zoomPanel=hud.querySelector('#zoom-panel');
 zoomPanel.addEventListener('input',()=>{actor.seatCameraHold=null;},true);
 zoomPanel.addEventListener('input',saveView);
 zoomPanel.addEventListener('click',e=>{if(e.target.closest('#zoom-reset')){actor.seatCameraHold=null;saveView();actor.updateCamera(1);}});
 const oldCamera=actor.updateCamera.bind(actor);actor.updateCamera=function(dt){
  const hold=this.seatCameraHold,viewport=document.querySelector('#GameCanvas')?.getBoundingClientRect();
  if(hold){
   const moved=hold.exitPosition&&Math.hypot(this.pos.x-hold.exitPosition.x,this.pos.z-hold.exitPosition.z)>.03;
   if(hold.room!==this.room?.id||!viewport||viewport.width!==hold.width||viewport.height!==hold.viewportHeight||moved)this.seatCameraHold=null;
   else{this.camera.node.setPosition(hold.position.x,hold.position.y,hold.position.z);this.camera.orthoHeight=hold.height;return;}
  }
  // Use the original camera and saved zoom. Seating never chooses a different mode.
  oldCamera(dt);this.reviewFrame=null;
 };
 actor.reviewFrame=null;actor.overview=savedOverview;saveView();actor.updateCamera(1);actor.updateHUD();
 window.__simpleInteraction={ready:true,pickupRange:.85,notice};
 actor.cleanups.push(()=>{clearTimeout(toastTimer);document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);});
 // Move the real controls, preserving fullscreen handlers and panel animation origins.
 while(['inventory-entry','wardrobe','grimoire-entry','game-volume-button','reentry'].some(id=>!hud.querySelector('#'+id)))await new Promise(r=>setTimeout(r,100));
 const quick=document.createElement('nav');quick.id='tavern-quick-actions';quick.setAttribute('aria-label','常用功能');hud.append(quick);
 const screenActions=document.createElement('nav');screenActions.id='tavern-screen-actions';screenActions.setAttribute('aria-label','屏幕显示');hud.append(screenActions);
 const icons={
  landscape:'<rect x="3" y="7" width="22" height="14" rx="3"/><path d="M21 12v4M8 3l-3 3 3 3M5 6h8"/>',
  fullscreen:'<path d="M10 5H7a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M5 18v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3"/><path d="M10 10l-4-4m12 4 4-4M10 18l-4 4m12-4 4 4"/>',
  'gait-mode':'<circle cx="16" cy="5" r="2.5"/><path d="m10 24 3-7-2-5m2 5 5 3 1 4M7 13l4-5 5 1 2 6 4 1M16 9l-3 8"/>',
  wardrobe:'<path d="M5 24V7c0-5 18-5 18 0v17H5Zm9-20v20M7 24v2m14-2v2"/><path d="M11 13v3m6-3v3M8 8h3m6 0h3"/>',
  'inventory-entry':'<path d="M10 7V5a4 4 0 0 1 8 0v2M5 12a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V12Z"/><path d="M5 13c5 4 13 4 18 0M10 20h8M14 14v4"/>'
 };
 for(const id of ['landscape','fullscreen','gait-mode','wardrobe','inventory-entry']){const b=hud.querySelector('#'+id);b.classList.add('quick-action');const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" fill="none" stroke="#745027" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+icons[id]+'</svg>';b.style.setProperty('--quick-icon','url("data:image/svg+xml,'+encodeURIComponent(svg)+'")');(['landscape','fullscreen'].includes(id)?screenActions:quick).append(b);}
 const quickStyle=document.createElement('style');quickStyle.textContent=`
 #tavern-ui :is(#tavern-quick-actions,#tavern-screen-actions){position:absolute;top:10px;right:12px;display:flex;gap:6px;z-index:8;pointer-events:auto}
 #tavern-ui :is(#tavern-quick-actions,#tavern-screen-actions) .quick-action{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;width:44px;height:48px;min-height:0;padding:4px 0 3px;margin:0;border:1px solid #fff1c8;border-radius:14px;background:linear-gradient(160deg,#fff4ce 0%,#f2d78d 58%,#d9ad58 100%);box-shadow:inset 0 2px 1px #fffbea,inset 0 -3px 1px #b983354f,0 3px 0 #765026,0 5px 9px #26170c38;color:#664820;font-size:0;cursor:pointer;transition:transform .12s,filter .12s;touch-action:manipulation}
 #tavern-ui :is(#tavern-quick-actions,#tavern-screen-actions) .quick-action::before{content:'';display:block;width:23px;height:23px;background:var(--quick-icon) center/contain no-repeat}
 #tavern-ui :is(#tavern-quick-actions,#tavern-screen-actions) .quick-action::after{content:attr(data-caption);font:600 10px/1.2 system-ui;letter-spacing:.04em;color:#674820}
 #tavern-ui :is(#tavern-quick-actions,#tavern-screen-actions) .quick-action>svg{display:none}
 #tavern-ui :is(#tavern-quick-actions,#tavern-screen-actions) .quick-action:active{transform:translateY(2px);box-shadow:inset 0 2px 3px #a5713544,0 1px 0 #765026}
 #tavern-ui :is(#tavern-quick-actions,#tavern-screen-actions) .quick-action[aria-pressed=true],#tavern-ui :is(#tavern-quick-actions,#tavern-screen-actions) .quick-action[aria-checked=true]{background:linear-gradient(155deg,#ffe7a8,#e9b958);border-color:#ffedb8}
 #tavern-ui :is(#tavern-quick-actions,#tavern-screen-actions) .quick-action:focus-visible{outline:2px solid #fff3ce;outline-offset:4px}
 #tavern-ui :is(#tavern-quick-actions,#tavern-screen-actions) .quick-action:disabled{opacity:.65;cursor:wait}
 #tavern-ui #game-menu>summary{border:1px solid #fff0c18c;border-radius:13px;background:linear-gradient(#f5df9bea,#d9b56ae8);color:#684820;box-shadow:inset 0 1px #fff5d0,0 2px 0 #765026;font-weight:600}
 #tavern-ui .top{max-width:calc(100% - 224px)!important}#tavern-ui h1{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 #tavern-ui #game-menu{top:70px!important;right:12px!important}#tavern-ui #world-clock{top:48px!important;left:16px!important;right:auto!important;text-align:left;place-content:start}
 #tavern-ui.loading :is(#tavern-quick-actions,#tavern-screen-actions){visibility:hidden}
 @media(hover:hover){#tavern-ui :is(#tavern-quick-actions,#tavern-screen-actions) .quick-action:hover{filter:brightness(1.06);transform:translateY(-1px)}}
 @media(prefers-reduced-motion:reduce){#tavern-ui :is(#tavern-quick-actions,#tavern-screen-actions) .quick-action{transition:none}}
 `;hud.append(quickStyle);
 function captions(){for(const b of [...screenActions.children,...quick.children]){let caption=b.id==='landscape'?(b.getAttribute('aria-pressed')==='true'?'自动方向':'横屏'):b.id==='fullscreen'?(b.getAttribute('aria-checked')==='true'||b.getAttribute('aria-pressed')==='true'?'退出全屏':'全屏'):b.id==='gait-mode'?(b.getAttribute('aria-pressed')==='true'?'奔跑':'走路'):b.id==='wardrobe'?'衣橱':b.textContent.replace(/\s/g,'').replace(/·(\d+)$/,(_,n)=>Number(n)?'·'+(Number(n)>99?'99+':n):'');b.dataset.caption=caption;b.setAttribute('aria-label',caption);}}
 const observer=new MutationObserver(captions);observer.observe(quick,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-pressed','aria-checked']});observer.observe(screenActions,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-pressed','aria-checked']});captions();actor.cleanups.push(()=>observer.disconnect());
 const branches=document.createElement('nav');branches.id='tavern-menu-branches';branches.setAttribute('aria-label','小游戏、传送与设置');
 const gear='<path d="m10 3 1-2h4l1 2 3 2 2-.2 2 3.5-1.3 1.8v3.8L23 16l-2 3.5-2-.2-3 2-1 2h-4l-1-2-3-2-2 .2L3 16l1.3-2.1v-3.8L3 8.3l2-3.5 2 .2 3-2Z"/><circle cx="13" cy="12" r="4"/>';
 const controller='<path d="M8 7h12c3 0 5 14 2 15-2 1-5-4-6-4h-4c-1 0-4 5-6 4C3 21 5 7 8 7Z"/><path d="M8 11v6m-3-3h6"/><circle cx="18" cy="12" r=".7"/><circle cx="21" cy="15" r=".7"/>';
 const svg=path=>'<svg aria-hidden="true" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg>';
 const teleportIcon='<path d="M8 22V10a6 6 0 0 1 12 0v12M5 24h18M13 14h11m-4-4 4 4-4 4"/>';
 branches.innerHTML='<button id="menu-games" type="button" aria-expanded="false" aria-controls="menu-games-panel">'+svg(controller)+'<span>小游戏</span></button><button id="menu-teleport" type="button" aria-expanded="false" aria-controls="menu-teleport-panel">'+svg(teleportIcon)+'<span>传送</span></button><button id="menu-settings" type="button" aria-label="设置" aria-expanded="false" aria-controls="menu-settings-panel">'+svg(gear)+'<span>设置</span></button>';
 const panels=document.createElement('div');panels.id='tavern-menu-panels';panels.innerHTML='<nav id="menu-games-panel" aria-label="小游戏"></nav><nav id="menu-teleport-panel" aria-label="传送地点"></nav><nav id="menu-settings-panel" aria-label="设置选项"></nav>';hud.append(branches,panels);
 const teleport=panels.querySelector('#menu-teleport-panel');
 for(const [id,label] of [['room-hall','说书人大厅'],['lower','一楼楼梯口'],['upper','二楼楼梯口']]){
  const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.destination=id;teleport.append(button);
  button.onclick=async()=>{
   if(actor.transitioning||actor.contextLost||actor.passwordDialog||!actor.entered||window.__propAction?.state().busy)return;
   const destination=actor.rooms.find(r=>r.id===id),stairs=id==='room-hall'?null:actor.rooms.flatMap(r=>r.items).find(t=>t.autoStairs&&t.to===id);
   if(!destination){notice('这个地点暂时无法到达');return;}
   menu.open=false;syncMenu();window.__bedTrial?.wake(true);window.__seatTrial?.leave(true);actor.seatCameraHold=null;
   try{await actor.travel(id,stairs?.arrival||destination.spawn);if(actor.transitionError)notice('传送暂未成功，请稍后再试');else notice('已到达'+label);}catch{notice('传送暂未成功，请稍后再试');}
  };
 }
 const games=panels.querySelector('#menu-games-panel'),settings=panels.querySelector('#menu-settings-panel');games.append(hud.querySelector('#grimoire-entry'));games.firstElementChild.textContent='血染';
 for(const id of ['game-volume-button','zoom-toggle','reentry'])settings.append(hud.querySelector('#'+id));settings.querySelector('#reentry').textContent='清空缓存';settings.querySelector('#reentry').style.cssText='';
 const menuStyle=document.createElement('style');menuStyle.textContent=`
 #tavern-ui #game-menu{top:10px!important;right:12px!important;width:44px;z-index:12}
 #tavern-ui #game-menu>summary{box-sizing:border-box;display:grid;place-items:center;width:44px;height:48px;padding:0;font-size:12px;border-radius:14px}
 #tavern-ui #game-menu .views{display:none!important}
 #tavern-ui #tavern-screen-actions{top:10px;right:66px}
 #tavern-ui #tavern-quick-actions{top:10px;right:166px;opacity:0;visibility:hidden;transform:translateX(30px);clip-path:inset(-8px -8px -12px 100%);transition:transform .26s cubic-bezier(.2,.8,.2,1),clip-path .26s cubic-bezier(.2,.8,.2,1),opacity .18s,visibility 0s .26s}
 #tavern-ui.menu-expanded #tavern-quick-actions{opacity:1;visibility:visible;transform:translateX(0);clip-path:inset(-8px -8px -12px -8px);transition-delay:0s}
 #tavern-ui #tavern-menu-branches{position:absolute;right:12px;top:68px;display:flex;flex-direction:column;gap:10px;z-index:11;pointer-events:auto;opacity:0;visibility:hidden;transform:translateY(-18px);transition:transform .26s cubic-bezier(.2,.8,.2,1),opacity .18s,visibility 0s .26s}
 #tavern-ui.menu-expanded #tavern-menu-branches{opacity:1;visibility:visible;transform:translateY(0);transition-delay:0s}
 #tavern-ui #tavern-menu-branches button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;box-sizing:border-box;width:44px;height:48px;min-height:0;margin:0;padding:3px 0;border:1px solid #fff1c8;border-radius:14px;background:linear-gradient(155deg,#fff3ca,#e3bc6b);box-shadow:inset 0 2px #fff9df,0 3px 0 #765026,0 5px 9px #26170c38;color:#745027;cursor:pointer;font:600 10px/1.2 system-ui}
 #tavern-ui #tavern-menu-branches svg{width:25px;height:25px}#tavern-ui #tavern-menu-branches button[aria-expanded=true]{background:linear-gradient(#ffe5a4,#d9a852)}
 #tavern-ui #tavern-menu-panels>nav{position:absolute;right:66px;top:68px;z-index:11;display:grid;gap:5px;box-sizing:border-box;width:172px;padding:8px;border:1px solid #f9e2aa;border-radius:15px;background:linear-gradient(140deg,#fff0c7fa,#e6c783fa);box-shadow:0 4px 12px #291b1155;pointer-events:auto;opacity:0;visibility:hidden;transform:translateX(16px);transition:transform .2s,opacity .16s,visibility 0s .2s}
 #tavern-ui #tavern-menu-panels>nav[data-open=true]{opacity:1;visibility:visible;transform:translateX(0);transition-delay:0s}
 #tavern-ui #tavern-menu-panels>#menu-teleport-panel{top:126px}
 #tavern-ui #tavern-menu-panels>#menu-settings-panel{top:184px}
 #tavern-ui #tavern-menu-panels button{min-height:42px;box-sizing:border-box;width:100%;margin:0;padding:8px 12px;border:1px solid #b78e4a50;border-radius:9px;background:#fff9e173;color:#674820;font:14px/1.4 system-ui;text-align:left;cursor:pointer}
 #tavern-ui #tavern-menu-panels button:hover{background:#fff7de}#tavern-ui #tavern-menu-branches button:focus-visible,#tavern-ui #tavern-menu-panels button:focus-visible{outline:2px solid #fff7dd;outline-offset:3px}
 #tavern-ui .top{max-width:calc(100% - 185px)!important;transition:opacity .15s}#tavern-ui.menu-expanded .top{opacity:0;pointer-events:none}
 #tavern-ui #world-clock{top:48px!important;left:16px!important;right:auto!important;text-align:left;place-content:start}#tavern-ui.menu-expanded #world-clock{visibility:hidden}
 #tavern-ui .zoom-panel{top:clamp(66px,calc(100% - 190px),200px)!important;right:12px}
 @media(prefers-reduced-motion:reduce){#tavern-ui #tavern-quick-actions,#tavern-ui #tavern-menu-branches,#tavern-ui #tavern-menu-panels>nav,#tavern-ui .top{transition:none}}
 `;hud.append(menuStyle);
 let submenu=null;
 function syncMenu(){const open=menu.open;hud.classList.toggle('menu-expanded',open);quick.inert=branches.inert=!open;menu.querySelector('summary').setAttribute('aria-expanded',String(open));if(!open)submenu=null;for(const [name,panel]of [['games',games],['teleport',teleport],['settings',settings]]){const shown=open&&submenu===name;panel.dataset.open=String(shown);panel.inert=!shown;branches.querySelector('#menu-'+name).setAttribute('aria-expanded',String(shown));}}
 for(const name of ['games','teleport','settings'])branches.querySelector('#menu-'+name).onclick=()=>{submenu=submenu===name?null:name;syncMenu();};
 menu.addEventListener('toggle',syncMenu);syncMenu();actor.cleanups.push(()=>menu.removeEventListener('toggle',syncMenu));
 window.__quickActions={ready:true};
})();

;
/* Local inventory: portable scene props enter the bag, then return to clear floor space. */
(async()=>{
 while(!window.__simpleInteraction?.ready||!window.__propAction)await new Promise(r=>setTimeout(r,100));
 const a=window.__tavernRoomController;
 const {resources,Prefab,instantiate,MeshRenderer,Vec3,game}=await System.import('cc');
 const {createFunctionPanel}=await import('/tavern/function-panel.js');
 const prepared=window.SceneInventory.prepare(a),{storageKey,catalog,baseRooms,records,portable,keyFor,itemData,syncRooms}=prepared,groups=new Map();
 let busy=false,opening=false,panelRoot=null;
 const button=document.createElement('button');button.id='inventory-entry';button.type='button';a.hud.querySelector('.views').append(button);
 function notice(message){a.hint=message;window.__simpleInteraction.notice(message);}
 function persist(){try{localStorage.setItem(storageKey,JSON.stringify({version:1,items:records}));}catch{notice('本次操作已完成，但浏览器未能保存背包。');}}
 function bag(){return records.filter(r=>r.location.type==='bag');}
 function updateButton(){button.textContent='背包 · '+bag().length;}
 function destroyGroup(key){const group=groups.get(key);if(!group)return;group.light?.destroy();for(const n of group.nodes)n.destroy();for(const p of group.prefabs)p.decRef();groups.delete(key);}
 function commitPickup(t){if(a.transitioning||!t.node.isValid||!t.node.active||!a.nearby().includes(t))return false;
  const key=t.data.inventoryKey||keyFor(a.room.id,t.data.id);let r=records.find(r=>r.key===key);
  if(r?.location.type==='bag')return false;
  let members;if(r)members=r.members;else{const ids=new Set([t.data.id]);for(let i=0;i<8;i++)for(const d of a.room.items)if(d.host&&ids.has(d.host)&&portable(d))ids.add(d.id);members=[...ids].map(id=>keyFor(a.room.id,id));if(!members.every(k=>catalog.has(k)))return false;r={key,members,location:{type:'bag'}};records.push(r);}
  r.location={type:'bag'};const ids=new Set(r.members.map(k=>catalog.get(k).data.id));
  for(const thing of a.things)if(thing.data.inventoryKey===key||ids.has(thing.data.id))thing.node.active=false;
  if(groups.has(key)){const nodes=new Set(groups.get(key).nodes);a.things=a.things.filter(x=>!nodes.has(x.node));destroyGroup(key);}
  a.carrying=null;a.preferredTarget='';syncRooms();persist();updateButton();notice((t.data.label||'物品')+'已放入背包');a.updateHUD();return true;
 }
 async function pickup(t){if(busy||opening||a.transitioning)return false;busy=true;try{return await __propAction.play('pickup',t.node.worldPosition,()=>commitPickup(t));}catch(e){notice(e.message);return false;}finally{busy=false;}}
 async function prepareGroup(r){const nodes=[],prefabs=[];try{for(const member of r.members){const d=catalog.get(member).data;const prefab=await new Promise((ok,no)=>resources.load('models/'+d.model+'/'+d.model,Prefab,(e,p)=>e?no(e):ok(p)));prefab.addRef();prefabs.push(prefab);const n=instantiate(prefab);n.active=false;a.stage.addChild(n);n.name='Inventory prop '+member;n.setRotationFromEuler(0,d.rot||0,0);const scale=d.scale??1;if(Array.isArray(scale))n.setScale(...scale);else n.setScale(scale,scale,scale);
   const origin=catalog.get(r.key).data;n.setPosition(d.x-origin.x,d.y-origin.y,d.z-origin.z);for(const renderer of n.getComponentsInChildren(MeshRenderer)){renderer.receiveShadow=0;renderer.shadowCastingMode=1;renderer.sharedMaterials.forEach((m,index)=>{if(m)renderer.setMaterial(a.surfaceMaterial(m,d.model),index);});}nodes.push(n);}
  let minY=Infinity,radius=.08;const v=new Vec3();for(const n of nodes)for(const renderer of n.getComponentsInChildren(MeshRenderer)){const mesh=renderer.mesh;if(!mesh)continue;renderer.node.updateWorldTransform();for(const x of [mesh.minPosition.x,mesh.maxPosition.x])for(const y of [mesh.minPosition.y,mesh.maxPosition.y])for(const z of [mesh.minPosition.z,mesh.maxPosition.z]){Vec3.transformMat4(v,new Vec3(x,y,z),renderer.node.worldMatrix);minY=Math.min(minY,v.y);radius=Math.max(radius,Math.hypot(v.x,v.z));}}
  if(!Number.isFinite(minY))throw Error('无法读取物品模型');return{nodes,prefabs,minY,radius,light:null};
 }catch(e){nodes.forEach(n=>n.destroy());prefabs.forEach(p=>p.decRef());throw e;}}
 function groundPoint(radius){const b=a.room.bounds,forward=({S:Math.PI/2,N:-Math.PI/2,E:0,W:Math.PI})[a.facing]??Math.PI/2;
  for(let distance=.55+radius;distance<=2.1;distance+=.22)for(let i=0;i<24;i++){const angle=forward+Math.ceil(i/2)*Math.PI/12*(i%2?1:-1),x=a.pos.x+Math.cos(angle)*distance,z=a.pos.z+Math.sin(angle)*distance;
   if(x-radius<b[0]+.15||x+radius>b[1]-.15||z-radius<b[2]+.15||z+radius>b[3]-.15||!__tavern.fits(x,z))continue;
   let clear=true;for(let j=0;j<12;j++){const q=j*Math.PI/6;if(!__tavern.fits(x+Math.cos(q)*radius,z+Math.sin(q)*radius)){clear=false;break;}}if(!clear)continue;
   if(a.room.items.some(d=>d.triggerRect&&x>d.triggerRect[0]-radius&&x<d.triggerRect[1]+radius&&z>d.triggerRect[2]-radius&&z<d.triggerRect[3]+radius))continue;
   if(records.some(r=>r.location.type==='ground'&&r.location.room===a.room.id&&Math.hypot(x-r.location.x,z-r.location.z)<radius+(r.location.radius||.2)+.08))continue;
   // A clear landing spot must also be on this side of any wall.
   for(let j=1;j<12&&clear;j++){const px=a.pos.x+(x-a.pos.x)*j/12,pz=a.pos.z+(z-a.pos.z)*j/12;if(a.blocks().some(w=>w.name==='wall'&&Math.abs(px-w.x)<w.w/2+.02&&Math.abs(pz-w.z)<w.d/2+.02))clear=false;}
   if(clear)return{x,z};
  }return null;
 }
 async function drop(key){if(busy||opening||a.transitioning)return false;const r=records.find(r=>r.key===key&&r.location.type==='bag');if(!r)return false;busy=true;let prepared=null;const room=a.room.id,stage=a.stage;
  try{prepared=await prepareGroup(r);if(a.room.id!==room||a.stage!==stage||a.transitioning)throw Error('房间正在切换，请稍后再丢下');const p=groundPoint(prepared.radius);if(!p){notice('附近没有空地，物品仍在背包里');return false;}
   return await __propAction.play('drop',p,()=>{if(a.room.id!==room||a.stage!==stage||r.location.type!=='bag')return false;
   const location={type:'ground',room,x:p.x,y:.055-prepared.minY,z:p.z,radius:prepared.radius},ground={...r,location},data=r.members.map(k=>itemData(ground,k));
   for(let i=0;i<prepared.nodes.length;i++){const n=prepared.nodes[i],d=data[i];n.setPosition(d.x,d.y,d.z);n.name=d.id+' '+d.model;n.active=true;}
   if(a.baked){prepared.light=new a.baked.constructor(a.room.blocks.filter(b=>b.name==='wall'),a.stage,a.room.darkZones||[],a.atmos?.3:1);for(const n of prepared.nodes)prepared.light.add(n,true);prepared.light.update(a.bakedNow());}
   for(let i=0;i<data.length;i++)a.things.push({data:data[i],node:prepared.nodes[i],on:true,angle:0,pivots:[],home:prepared.nodes[i].position.clone(),bulbs:[],glass:[]});
   r.location=location;groups.set(key,prepared);prepared=null;syncRooms();persist();updateButton();a.preferredTarget=data[0].id;notice((data[0].label||'物品')+'已丢在地上，可走近拾取');a.updateHUD();return true;});
  }catch(e){console.error('Inventory drop:',e);notice(e.message||'暂时无法丢下，物品仍在背包里');return false;}finally{if(prepared){prepared.light?.destroy();prepared.nodes.forEach(n=>n.destroy());prepared.prefabs.forEach(p=>p.decRef());}busy=false;}
 }
 const previousNearby=a.nearby.bind(a);a.nearby=function(){return previousNearby().filter(t=>t.node.isValid&&t.node.active&&t.data.inventoryRoot!==false);};
 const previousInteract=a.interact.bind(a);a.interact=function(){if(opening||busy||this.transitioning||this.passwordDialog)return;if(!__seatTrial.state().seated){const t=this.nearest();if(t?.data.interactive==='cup'){pickup(t);return;}}return previousInteract();};
 const previousDispose=a.disposeRoom.bind(a);a.disposeRoom=function(){for(const key of [...groups.keys()])destroyGroup(key);return previousDispose();};
 const previousAtmosphere=a.applyAtmosphere.bind(a);a.applyAtmosphere=function(...args){const value=previousAtmosphere(...args);for(const group of groups.values())group.light?.update(this.bakedNow());return value;};
 async function open(){if(opening||busy||a.transitioning||document.querySelector('[data-function-panel]'))return;opening=true;const paused=game.isPaused();let shell,frame,root,shade,dropAfterClose=null;
  try{window.dispatchEvent(new Event('blur'));a.keys.clear();a.pad={x:0,z:0};game.pause();root=document.createElement('section');panelRoot=root;root.id='inventory-panel';root.tabIndex=-1;root.role='dialog';root.setAttribute('aria-modal','true');root.setAttribute('aria-label','背包');root.style.cssText='background:#282b24;color:#efe2c6;padding:22px;overflow:auto;font:15px/1.6 system-ui;';
   root.innerHTML='<style>#inventory-panel header{display:flex;align-items:center;justify-content:space-between;gap:12px}#inventory-panel h2{margin:0;font-size:22px}#inventory-panel p{color:#c2b99e}#inventory-panel button{border:1px solid #a28c60;background:#414638;color:#f1e5c9;border-radius:8px;padding:9px 14px;font:inherit;cursor:pointer}#inventory-panel button:disabled{opacity:.5;cursor:wait}#inventory-panel .bag-row{display:flex;align-items:center;justify-content:space-between;gap:14px;border-top:1px solid #bca16b30;padding:14px 0}#inventory-panel .bag-row span{min-width:0;overflow-wrap:anywhere}#inventory-panel .bag-row button{flex-shrink:0}#inventory-panel [role=status]{min-height:24px}</style><header><h2>背包</h2><button data-close aria-label="关闭背包">关闭</button></header><p>拿取的物品放在这里。丢下后可在地上重新拾取。</p><div data-items></div><p role="status"></p>';
   const imageStyle=document.createElement('style');imageStyle.textContent='#inventory-panel .bag-row{display:grid;grid-template-columns:72px minmax(0,1fr) auto;gap:10px}#inventory-panel .bag-image{width:72px;height:72px;object-fit:contain;background:#e6dcc219;border:1px solid #d6bf8b35;border-radius:9px}#inventory-panel .bag-members{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}#inventory-panel .bag-members img{width:36px;height:36px;border-radius:4px}#inventory-panel .bag-row button{padding:9px 10px}@media(max-width:380px){#inventory-panel{padding:16px!important}#inventory-panel .bag-row{grid-template-columns:60px minmax(0,1fr) auto;gap:7px}#inventory-panel .bag-row>.bag-image{width:60px;height:60px}}';root.append(imageStyle);
   function picture(key){const d=catalog.get(key).data,img=document.createElement('img');img.className='bag-image';img.src='/inventory-icons/'+encodeURIComponent(d.model)+'.png';img.alt=d.label||'物品';img.title=img.alt;img.width=256;img.height=256;img.decoding='async';return img;}
   const list=root.querySelector('[data-items]');for(const r of bag()){const row=document.createElement('div');row.className='bag-row';row.dataset.item=r.key;const info=document.createElement('div'),name=document.createElement('span');name.textContent=catalog.get(r.key).data.label||'物品';if(r.members.length>1)name.textContent+='（含 '+r.members.length+' 件）';info.append(name);if(r.members.length>1){const members=document.createElement('div');members.className='bag-members';for(const key of r.members.slice(1))members.append(picture(key));info.append(members);}const action=document.createElement('button');action.textContent='丢到地上';action.onclick=()=>{dropAfterClose=r.key;close();};row.append(picture(r.key),info,action);list.append(row);}if(!bag().length)list.textContent='背包还是空的，走近杯子或书本可以拿取。';
   shade=document.createElement('div');document.body.append(shade,root);shell=createFunctionPanel(root,{originElement:button,shade,bounds:({width,height})=>{const w=Math.min(560,width-24),h=Math.min(620,height-40);return{left:(width-w)/2,top:(height-h)/2,width:w,height:h};}});
   let closing=false;function close(){if(closing||busy)return;closing=true;shell.close(performance.now()/1000);}root.querySelector('[data-close]').onclick=close;root.addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key==='Tab'){const options=[...root.querySelectorAll('button:not(:disabled)')];const first=options[0],last=options.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===root)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});root.focus();
   await new Promise(resolve=>{const draw=t=>{if(shell.draw(t/1000).closed)resolve();else frame=requestAnimationFrame(draw);};frame=requestAnimationFrame(draw);});
  }finally{cancelAnimationFrame(frame);shell?.dispose();root?.remove();shade?.remove();panelRoot=null;opening=false;if(!paused&&!window.__gamePreviewInactive)game.resume();button.focus();}
  if(dropAfterClose)await drop(dropAfterClose);
 }
 button.onclick=()=>void open();
 // Rebuild once so newly portable books are independent of static light batches.
 // Subsequent pickups hide only their own nodes; drops add only their own models.
 if(!prepared.prebuilt){syncRooms();const camera={position:{...a.camera.node.position},height:a.camera.orthoHeight};__seatTrial.leave(true);const arrival={...a.pos};await a.ensureRoom(a.room.id);a.changeFloor(a.room.id,arrival);a.camera.node.setPosition(camera.position.x,camera.position.y,camera.position.z);a.camera.orthoHeight=camera.height;const rect=document.querySelector('#GameCanvas').getBoundingClientRect();a.seatCameraHold={...camera,room:a.room.id,width:rect.width,viewportHeight:rect.height,exitPosition:{...a.pos}};}
 updateButton();window.__inventory={ready:true,list:()=>bag().map(r=>({key:r.key,label:catalog.get(r.key).data.label,count:r.members.length})),drop,open,state:()=>structuredClone({items:records,busy,opened:opening})};
})().catch(e=>console.error('Inventory setup:',e));

;
/* Procedural relief and cloth surfaces. Original character/cloth textures remain untouched. */
(function(root){
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
 const bell=(x,z,cx,cz,rx,rz)=>Math.exp(-2*((x-cx)**2/rx**2+(z-cz)**2/rz**2));
 function bodyHeight(x,z){
  // Keep crown-to-chin on one supported head plane; a round bump here stretched the face.
  const head=.22*Math.exp(-2*x*x/.24**2)*smooth((z+.77)/.12)*(1-smooth((z+.32)/.15)),chest=.13*bell(x,z,0,-.13,.20,.22),hips=.105*bell(x,z,0,.13,.21,.20);
  const legs=.065*Math.max(bell(x,z,-.075,.43,.075,.31),bell(x,z,.075,.43,.075,.31));
  const hair=.035*bell(x,z,0,-.35,.46,.35);
  return .015+Math.max(head,chest,hips,legs,hair);
 }
 function bodyGeometry(yaw=0){const g={positions:[],normals:[],uvs:[],indices:[],colors:[]},nx=48,nz=72,angle=yaw*Math.PI/180,kx=-Math.sin(angle)/Math.tan(50*Math.PI/180),kz=Math.cos(angle)/Math.tan(50*Math.PI/180);
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const u=i/nx,v=j/nz,x=u-.5,z=(v-.5)*1.5,h=bodyHeight(x,z),dx=(bodyHeight(x+.002,z)-bodyHeight(x-.002,z))/.004,dz=(bodyHeight(x,z+.002)-bodyHeight(x,z-.002))/.004,ny=1+kx*dx+kz*dz,n=Math.hypot(dx,ny,dz);
   // Add depth along the actual camera ray so the face and original silhouette are not stretched.
   g.positions.push(x+kx*h,h,z+kz*h);g.normals.push(-dx/n,ny/n,-dz/n);g.uvs.push(u,v);
   // Neutral contact shading only; no hue adjustment or palette replacement.
   const light=clamp(.96+(-dx*.12-dz*.10)/n,.87,1);g.colors.push(light,light,light,1);
  }for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const k=j*(nx+1)+i;g.indices.push(k,k+nx+1,k+1,k+1,k+nx+1,k+nx+2);}return g;
 }
 function shadowGeometry(){const g={positions:[],colors:[],indices:[]};
  for(const [cx,cz,rx,rz,alpha] of [[0,-.49,.24,.23,.20],[0,-.25,.39,.22,.10],[0,-.05,.23,.29,.16],[0,.20,.23,.22,.14],[-.075,.45,.10,.27,.10],[.075,.45,.10,.27,.10]]){
   const base=g.positions.length/3,segments=32,rings=5;for(let j=0;j<=rings;j++){const r=j/rings;for(let i=0;i<segments;i++){const angle=i*Math.PI*2/segments;g.positions.push(cx+Math.cos(angle)*rx*r,0,cz+Math.sin(angle)*rz*r);g.colors.push(.12,.10,.12,alpha*(1-r*r)**2);}}
   for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){const a=base+j*segments+i,b=base+j*segments+(i+1)%segments;g.indices.push(a,a+segments,b,b,a+segments,b+segments);}
  }return g;
 }
 // Subdivide along the longest edge, retaining source UVs and material boundaries.
 function subdivide(g){const out={positions:[],normals:[],uvs:[],tangents:[],colors:[],indices:[]},channels={positions:3,normals:3,uvs:2,tangents:4},shared=new Map();
  const vertex=i=>Object.fromEntries(Object.entries(channels).map(([k,n])=>[k,Array.from(g[k].slice(i*n,(i+1)*n))]));
  const midpoint=(a,b)=>Object.fromEntries(Object.keys(channels).map(k=>[k,a[k].map((v,i)=>(v+b[k][i])/2)]));
  function triangle(a,b,c,depth=0){const vs=[a,b,c],d=vs.map((v,i)=>Math.hypot(...v.positions.map((p,j)=>(p-vs[(i+1)%3].positions[j])*(j===0?.45:1)))),edge=d.indexOf(Math.max(...d));
   if(d[edge]>.105&&depth<13){const p=vs[edge],q=vs[(edge+1)%3],r=vs[(edge+2)%3],m=midpoint(p,q);triangle(p,m,r,depth+1);triangle(m,q,r,depth+1);return;}
   for(const v of vs){const key=Object.values(v).flat().map(n=>Math.round(n*1000000)).join(','),existing=shared.get(key);if(existing!==undefined){out.indices.push(existing);continue;}const index=out.positions.length/3;shared.set(key,index);out.indices.push(index);for(const k of Object.keys(channels))out[k].push(...v[k]);out.colors.push(1,1,1,1);}
  }
  for(let i=0;i<g.indices.length;i+=3)triangle(vertex(g.indices[i]),vertex(g.indices[i+1]),vertex(g.indices[i+2]));
  if(out.positions.length/3>65535)throw Error('Cloth surface exceeds 16-bit mesh capacity');
  return Object.fromEntries(Object.entries(out).map(([k,v])=>[k,k==='indices'?new Uint32Array(v):new Float32Array(v)]));
 }
 function clothMapper(progress,occupied,sideView=false){const p=clamp(progress),crease=.20,rows=64,cols=24,maxS=1.1,halfWidth=.8,step=maxS/rows,table=[];
  for(let col=0;col<=cols;col++){const x=(col/cols*2-1)*halfWidth,local=clamp(p-.065*Math.sin(Math.PI*p)*(Math.abs(x)/halfWidth)),front=.86*(1-local)-.055*local,curve=.20+.07*Math.sin(Math.PI*p),line=[[crease,.725]];
   for(let row=1;row<=rows;row++){const s=(row-.5)*step,theta=Math.PI*smooth((s-front)/curve),prev=line[row-1];line.push([prev[0]-Math.cos(theta)*step,prev[1]+Math.sin(theta)*step]);}table.push(line);
  }
  return function(x,y,z){let zz=z,yy=y;if(z<crease){const col=clamp((x/halfWidth+1)/2)*cols,row=clamp((crease-z)/maxS)*rows,i=Math.min(cols-1,Math.floor(col)),j=Math.min(rows-1,Math.floor(row)),u=col-i,v=row-j;
    const mix=k=>(table[i][j][k]*(1-v)+table[i][j+1][k]*v)*(1-u)+(table[i+1][j][k]*(1-v)+table[i+1][j+1][k]*v)*u;
    zz=mix(0);yy=mix(1)+(y-.725)*(1-.55*p);
   }
   // The side drawing includes the cheek/neck projection: keep the cloth edge
   // below the chin instead of pushing the head beyond the physical headboard.
   if(occupied&&sideView)zz+=.11*(1-p)*smooth((-.25-z)/.35);
   const dome=occupied?.15*bell(x,zz,0,-.04,.32,.52)+.07*bell(x,zz,0,.47,.20,.32):0;
   const edge=clamp(Math.abs(x)/.55),ripple=.022*Math.sin(x*15+zz*7)*Math.sin(Math.PI*p)*edge;
   const folds=.012*p*Math.sin(x*19+zz*9)*smooth((zz-.18)/.25);
   return[x,yy+dome+ripple+folds,zz];
  };
 }
 function deform(base,g,map){const eps=.001,sub=(a,b)=>a.map((n,i)=>(n-b[i])/(2*eps)),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  for(let i=0;i<base.positions.length;i+=3){const [x,y,z]=base.positions.subarray(i,i+3),q=map(x,y,z),dx=sub(map(x+eps,y,z),map(x-eps,y,z)),dy=sub(map(x,y+eps,z),map(x,y-eps,z)),dz=sub(map(x,y,z+eps),map(x,y,z-eps)),cx=cross(dy,dz),cy=cross(dz,dx),cz=cross(dx,dy);g.positions.set(q,i);
   const n=cx.map((v,k)=>v*base.normals[i]+cy[k]*base.normals[i+1]+cz[k]*base.normals[i+2]),length=Math.hypot(...n)||1;g.normals.set(n.map(v=>v/length),i);
   const j=i/3*4,t=dx.map((v,k)=>v*base.tangents[j]+dy[k]*base.tangents[j+1]+dz[k]*base.tangents[j+2]),tl=Math.hypot(...t)||1;g.tangents.set([...t.map(v=>v/tl),base.tangents[j+3]],j);
  }
 }
 // Complete, already-projected drawings. These depth values only register furniture
 // occlusion: they do not manufacture volume or re-light the artwork.
 function obliqueGeometry(yaw=0){
  const side=Math.abs(yaw)===90,mirror=yaw<0,w=side?1.65:.90,h=side?.825:1.35;
  const angle=yaw*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),pitch=50*Math.PI/180;
  const g={positions:[],normals:[],uvs:[],indices:[],colors:[]},nx=32,ny=48;
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
   const u=i/nx,v=j/ny,along=side?(mirror?1-u:u):v;
   const head=smooth((along-.08)/.05)*(1-smooth((along-(side?.275:.30))/(side?.035:.06)));
   const pillowClearance=.16*smooth((along-.28)/.03)*(1-smooth((along-.46)/.09));
   const depth=.035+Math.max(.30*head,pillowClearance+.055*Math.exp(-(((along-.52)/.19)**2)));
   const x=(u-.5)*w+(side?(mirror?.04:-.04):0),down=(v-.5)*h-(side?.04:.12);
   const z=(down+Math.cos(pitch)*depth)/Math.sin(pitch);
   g.positions.push(c*x-s*z,depth,s*x+c*z);g.normals.push(0,1,0);g.uvs.push(side&&mirror?1-u:u,v);g.colors.push(1,1,1,1);
  }
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const k=j*(nx+1)+i;g.indices.push(k,k+nx+1,k+1,k+1,k+nx+1,k+nx+2);}
  return g;
 }
 const api={bodyGeometry,obliqueGeometry,shadowGeometry,bodyHeight,subdivide,clothMapper,deform,smooth};if(typeof module!=='undefined')module.exports=api;else root.BedSurface=api;
})(typeof window!=='undefined'?window:globalThis);

;
/* Fold the blanket from the head toward the foot; render the body below the cloth. */
(async()=>{
 while(!window.__inventory?.ready)await new Promise(r=>setTimeout(r,100));
 const a=window.__tavernRoomController,cc=await System.import('cc');
 const {Node,Vec3,Vec4,Mat4,Material,MeshRenderer,Texture2D,ImageAsset,gfx,director,Director,utils,Color}=cc;
 const legacy=new URLSearchParams(location.search).get('lieArt')==='legacy';
 let textures=[];
 let textureIndex=0;
 const figure=new Node('Complete supine pose');a.node.addChild(figure);figure.active=false;
 const surface=window.BedSurface,geometry=legacy?surface.bodyGeometry:surface.obliqueGeometry,shadowMesh=utils.createMesh(surface.shadowGeometry()),poses=new Map();
 // Keep renderer/geometry pairs stable. Swapping mesh on a disabled Cocos renderer
 // retains stale GPU geometry after a room change, stretching the next direction.
 for(const yaw of [0,90,-90]){
  const node=new Node('Complete supine view '+yaw);figure.addChild(node);node.setPosition(0,legacy?.045:0,0);
  const mesh=utils.createMesh(geometry(yaw)),material=new Material();
  material.initialize({effectAsset:a.actorEffect,defines:{USE_TEXTURE:true,USE_ALPHA_TEST:true,USE_VERTEX_COLOR:true},states:{rasterizerState:{cullMode:gfx.CullMode.NONE}}});
  material.setProperty('tilingOffset',new Vec4(1,1,0,0));
  for(const key of ['hairGain','skinGain','clothGain'])material.setProperty(key,new Vec4(1,1,1,1));
  const renderer=node.addComponent(MeshRenderer);renderer.mesh=mesh;renderer.setMaterial(material,0);renderer.shadowCastingMode=0;renderer.receiveShadow=0;node.active=false;
  poses.set(yaw,{node,mesh,material,renderer});
 }
 const contact=new Node('Head shoulder and leg contact shadows');figure.addChild(contact);const shadowRenderer=contact.addComponent(MeshRenderer);shadowRenderer.mesh=shadowMesh;
 const shadowMat=new Material();shadowMat.initialize({effectAsset:a.unlitEffect,technique:1,defines:{USE_TEXTURE:false,USE_ALPHA_TEST:false,USE_VERTEX_COLOR:true},states:{rasterizerState:{cullMode:gfx.CullMode.NONE}}});shadowMat.setProperty('mainColor',Color.WHITE);shadowRenderer.setMaterial(shadowMat,0);shadowRenderer.shadowCastingMode=0;
 const coverButton=document.createElement('button');coverButton.id='bed-cover-action';coverButton.hidden=true;coverButton.style.marginLeft='8px';a.action.parentElement.insertBefore(coverButton,a.action.nextSibling);
 const notice=s=>{a.hint=s;__simpleInteraction.notice(s);};let resting=null;
 function world(t,name){t.node.updateWorldTransform();return Vec3.transformMat4(new Vec3(),new Vec3(...t.data.anchors.local[name]),t.node.worldMatrix);}
 const bedEdges=new WeakMap();
 function boundary(t){let polygon=bedEdges.get(t);if(polygon)return polygon;
  // Use the world-space collision outline: wide beds, rotated beds and scaled
  // instances must all expose their actual reachable edge, not one side anchor.
  polygon=a.room.blocks.find(b=>b.name===t.data.id)?.polygon;
  if(!polygon?.length){const halfWidth=Math.abs(t.data.anchors.local.ApproachAnchor[0])-.48;t.node.updateWorldTransform();polygon=[[-halfWidth,-1.1],[halfWidth,-1.1],[halfWidth,1.1],[-halfWidth,1.1]].map(([x,z])=>{const p=Vec3.transformMat4(new Vec3(),new Vec3(x,0,z),t.node.worldMatrix);return[p.x,p.z];});}
  bedEdges.set(t,polygon);return polygon;
 }
 function edgePoint(t,p){const polygon=boundary(t);let best=null,distance=Infinity;for(let i=0;i<polygon.length;i++){const [x,z]=polygon[i],[bx,bz]=polygon[(i+1)%polygon.length],dx=bx-x,dz=bz-z,u=Math.max(0,Math.min(1,((p.x-x)*dx+(p.z-z)*dz)/(dx*dx+dz*dz||1))),q={x:x+u*dx,z:z+u*dz},d=Math.hypot(p.x-q.x,p.z-q.z);if(d<distance){best=q;distance=d;}}return best;}
 function safePoint(p){const b=a.room.bounds;return p&&p.x>b[0]+.21&&p.x<b[1]-.21&&p.z>b[2]+.21&&p.z<b[3]-.21&&__tavern.fits(p.x,p.z);}
 function exitPoint(t,entry){if(safePoint(entry))return{...entry};for(const name of ['ExitAnchor','ApproachAnchor']){if(!t.data.anchors?.local?.[name])continue;const p=world(t,name);if(safePoint(p))return{x:p.x,z:p.z};}const p=t.node.worldPosition;for(let r=.75;r<2.5;r+=.15)for(let i=0;i<32;i++){const theta=i*Math.PI/16,x=p.x+Math.cos(theta)*r,z=p.z+Math.sin(theta)*r;if(safePoint({x,z}))return{x,z};}return null;}
 function wake(force=false){if(!resting)return true;const {thing:t,room,entry}=resting,same=room===a.room.id,exit=same&&t.node.isValid?exitPoint(t,entry):null;if(!exit&&!force){notice('床边没有可用的离床位置');return false;}figure.active=false;a.player.active=true;if(exit)a.pos=exit;if(a.seatCameraHold)a.seatCameraHold.exitPosition={...a.pos};a.vel={x:0,z:0};a.motionStamp=performance.now();a.frameName='';resting=null;if(same&&t.node.isValid)a.poseFurniture(t);a.drawFrame(0,false);a.animateFigure(0);notice('已起床');return true;}
 let loading=false;
 async function lie(t){if(!t||loading||a.transitioning||a.passwordDialog||window.__propAction?.state().busy)return false;const character=a.characterId,room=a.room.id;loading=true;try{const assets=await SceneActions.load(character,legacy?'lieLegacy':'lie');if(character!==a.characterId||room!==a.room.id||!t.node.isValid||a.transitioning)return false;textures=[assets.textures.front,assets.textures.side];for(const[yaw,pose]of poses)pose.renderer.getMaterialInstance(0).setProperty('mainTexture',textures[yaw===0?0:1]);}catch(e){notice(e.message);return false;}finally{loading=false;}if(!t.data.anchors?.local?.LieAnchor||!exitPoint(t,a.pos)){notice('床边没有可用位置');return false;}__seatTrial.leave(true);wake(true);const entry=safePoint(a.pos)?{...a.pos}:null,rect=document.querySelector('#GameCanvas').getBoundingClientRect();a.seatCameraHold={position:{...a.camera.node.position},height:a.camera.orthoHeight,room:a.room.id,width:rect.width,viewportHeight:rect.height};a.keys.clear();a.pad={x:0,z:0};a.vel={x:0,z:0};t.on=false;a.states.set(t.data.id,false);resting={thing:t,room:a.room.id,entry,phase:'lying'};a.poseFurniture(t);sync();a.updateHUD();notice('已躺下盖好被子，可掀开或起床');return true;}
 // Soft curl travels from the free head edge toward the foot; source UVs remain intact.
 const folded=new WeakMap(),motions=new WeakMap();
 function coverProgress(t){const now=performance.now(),goal=t.on?1:0;let m=motions.get(t);if(!m){m={value:t.progress||0,from:t.progress||0,goal,stamp:now};motions.set(t,m);}if(m.goal!==goal){m.from=m.value;m.goal=goal;m.stamp=now;}const elapsed=(now-m.stamp)/1150;m.value=m.from+(goal-m.from)*surface.smooth(elapsed);t.progress=m.value;return m.value;}
 function fold(t){const p=t.progress||0,occupied=resting?.thing===t;if(!a.baked?.batches.length)return;let dirty=false;const map=surface.clothMapper(p,occupied,!legacy&&Math.abs(t.data.rot||0)===90);
  for(const e of a.baked.entries){if(e.root!==t.node||!e.localNode?.name.startsWith('CoverPivot'))continue;
   let f=folded.get(e);if(!f){const base=surface.subdivide(e.geometry);e.geometry={...base,positions:base.positions.slice(),normals:base.normals.slice(),tangents:base.tangents.slice()};e.batch.geometry=e.geometry;e.world=new Float32Array(base.positions.length);e.normals=new Float32Array(base.normals.length);f={base,stamp:'',time:0,position:e.batch.renderer.node.position.clone()};folded.set(e,f);}
   // The occupied-body depth adjustment must not remain in front of a person
   // standing beside an empty bed after waking.
   if(occupied){const origin=e.localNode.worldPosition,inverse=Mat4.invert(new Mat4(),e.localNode.worldMatrix),offset=Vec3.transformMat4(new Vec3(),new Vec3(origin.x,origin.y+.32*Math.tan(50*Math.PI/180),origin.z+.32),inverse);e.batch.renderer.node.setPosition(Vec3.add(offset,offset,f.position));}
   else e.batch.renderer.node.setPosition(f.position);
   const key=p.toFixed(5)+':'+occupied,now=performance.now();if(f.stamp===key||(p!==0&&p!==1&&now-f.time<30))continue;f.stamp=key;f.time=now;surface.deform(f.base,e.geometry,map);dirty=true;
  }if(dirty)a.baked.refreshMoving(a.bakedNow(),new Set([t.node]));
 }
 const originalPose=a.poseFurniture.bind(a);a.poseFurniture=function(t){originalPose(t);if(t.data.interactive!=='bed')return;coverProgress(t);for(const part of t.parts||[])if(part.node.name.startsWith('CoverPivot')){part.node.setPosition(part.position);part.node.setScale(part.scale);part.node.setRotationFromEuler(part.rotation);}fold(t);};
 const originalNearby=a.nearby.bind(a);a.nearby=function(){
  const saved=[];for(const t of this.things)if(t.data.interactive==='bed'){saved.push([t,t.data.interactX,t.data.interactZ]);const p=edgePoint(t,this.pos);t.data.interactX=p.x;t.data.interactZ=p.z;}
  // The existing proximity AND line-of-sight checks use the nearest edge.
  // Keep the walkable approach metadata for navigation/other consumers.
  try{return originalNearby();}finally{for(const[t,x,z]of saved){t.data.interactX=x;t.data.interactZ=z;}}
 };
 function prepareBeds(){for(const t of a.things)if(t.data.interactive==='bed'){const anchor=world(t,'ApproachAnchor'),p=safePoint(anchor)?anchor:exitPoint(t);if(p){t.data.interactX=p.x;t.data.interactZ=p.z;}boundary(t);a.poseFurniture(t);}}
 const originalInteract=a.interact.bind(a);a.interact=function(){if(resting){wake();return;}const t=this.nearest();if(t?.data.interactive==='bed'){lie(t);return;}return originalInteract();};
 coverButton.onclick=()=>{const t=resting?.thing||a.nearest();if(t?.data.interactive==='bed'){t.on=!t.on;a.states.set(t.data.id,t.on);a.updateHUD();notice(t.on?'从床头往床尾掀开被子':'盖好被子');}};
 const originalHUD=a.updateHUD.bind(a);a.updateHUD=function(){originalHUD();const t=resting?.thing||this.nearest(),bed=t?.data.interactive==='bed';coverButton.hidden=!bed;coverButton.textContent=t?.on?'盖好被子':'掀开被子';if(resting){this.action.hidden=false;this.action.disabled=false;this.action.textContent='起床 · E';this.cycle.hidden=true;}else if(bed){this.action.hidden=false;this.action.disabled=false;this.action.textContent='躺下 · E';}};
 const originalAdvance=a.advanceMotion.bind(a);a.advanceMotion=function(){if(resting){const moving=Math.hypot(this.pad.x,this.pad.z)>0||['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].some(k=>this.keys.has(k));if(moving)wake();this.motionStamp=performance.now();return;}return originalAdvance();};
 for(const method of ['setCharacter','finishArrival','reset']){const original=a[method].bind(a);a[method]=function(...args){wake(true);const value=original(...args);if(method==='setCharacter')return Promise.resolve(value).finally(()=>wake(true));if(method==='finishArrival')prepareBeds();return value;};}
 const originalSave=a.savePosition.bind(a);a.savePosition=function(){if(!resting)return originalSave();};
 const originalSit=__seatTrial.sit;__seatTrial.sit=(...args)=>{wake(true);return originalSit(...args);};
 function sync(){
  if(!resting)return;
  if(!resting.thing.node.isValid||resting.room!==a.room.id){wake(true);return;}
  const t=resting.thing,p=world(t,'LieAnchor'),yaw=t.data.rot||0,tint=a.actorMat.getProperty('mainColor');
  figure.setPosition(p.x,p.y+.02,p.z);figure.setRotationFromEuler(0,yaw,0);
  for(const [direction,pose] of poses){pose.node.active=direction===yaw;if(direction===yaw&&tint)pose.renderer.getMaterialInstance(0).setProperty('mainColor',tint);}
  textureIndex=!legacy&&Math.abs(yaw)===90?1:0;figure.active=true;a.player.active=false;a.pos={x:p.x,z:p.z};a.vel={x:0,z:0};
 }
 director.on(Director.EVENT_AFTER_UPDATE,sync);prepareBeds();
 // Supersample full-quality rendering, preserving camera, CSS size and sprite proportions.
 let renderScale=1;
 if(window.SceneRender){SceneRender.prepare(a,director);renderScale=SceneRender.scale;}
 else if(new URLSearchParams(location.search).get('quality')==='full'){
  const root=director.root,resize=root.resize,canvas=document.querySelector('#GameCanvas');
  root.resize=function(w,h){renderScale=Math.max(1,Math.min(2,Math.sqrt(6000000/(w*h))));return resize.call(this,Math.round(w*renderScale),Math.round(h*renderScale));};
  root.resize(canvas.width,canvas.height);a.cleanups.push(()=>{root.resize=resize;});
 }
 a.cleanups.push(()=>{director.off(Director.EVENT_AFTER_UPDATE,sync);figure.destroy();shadowMat.destroy();poses.forEach(pose=>{pose.material.destroy();pose.mesh.destroy();});shadowMesh.destroy();coverButton.remove();});
 window.__bedTrial={lie:id=>lie(a.things.find(t=>t.data.id===id)),wake,state:()=>({character:a.characterId,art:legacy?'rejected-overhead-v1':a.characterId==='blue-a'?'oblique-v3-candidate':'character-actions-v1-candidate',view:textureIndex?'side':'foot',resting:!!resting,phase:resting?.phase||'standing',id:resting?.thing.data.id,room:a.room.id,position:{...a.pos},figure:figure.active,standing:a.player.active,coverOpen:resting?.thing.on,coverProgress:resting?.thing.progress,renderScale})};
})().catch(e=>console.error('Bed setup:',e));




;
/* Ordinary nearby lamp switch; keep its light visible by day without scene markers. */
(async()=>{
 while(!window.__inventory?.ready||!window.__bedTrial)await new Promise(r=>setTimeout(r,100));
 const a=window.__tavernRoomController;
 const oldLook=a.lampLook.bind(a);a.lampLook=function(t){oldLook(t);for(const n of [...t.bulbs,...t.halos||[]])n.active=t.on;for(const g of t.glass){const lit=this.litShades.get(g.off);if(lit)g.r.setMaterial(t.on?lit:g.off,g.i);}};
 const oldAtmosphere=a.applyAtmosphere.bind(a);a.applyAtmosphere=function(...args){const value=oldAtmosphere(...args);for(const t of this.things)if(t.data.lamp)this.lampLook(t);return value;};
 a.applyAtmosphere();
 const names=['铜烛台','铁艺红烛灯','玻璃油灯','镂空陶灯','布罩台灯','铁艺壁灯'];
 const label=t=>names[Number(t.data.model.match(/^light-v7-(\d+)$/)?.[1])]||t.data.label||'灯';
 const oldHUD=a.updateHUD.bind(a);a.updateHUD=function(){oldHUD();const t=this.nearest();if(t?.data.lamp&&!this.action.hidden&&!__seatTrial.state().seated&&!__bedTrial.state().resting)this.action.textContent=(t.on?'熄灭':'点亮')+label(t)+' · E';};
 const oldInteract=a.interact.bind(a);a.interact=function(){const t=this.nearest(),before=t?.on;const result=oldInteract();if(t?.data.lamp&&t.on!==before)window.__simpleInteraction.notice(label(t)+(t.on?'已点亮':'已熄灭'));return result;};
 window.__lampInteraction={ready:true};a.updateHUD();
})().catch(e=>console.error('Lamp interaction:',e));


;
/* Display this visit's chosen name; follow the visible pose without touching the camera. */
(async()=>{
 while(!window.__bedTrial||!window.__quickActions?.ready)await new Promise(r=>setTimeout(r,100));
 const a=window.__tavernRoomController,{Vec3,MeshRenderer,gfx,director,Director}=await System.import('cc');
 const tag=document.createElement('div');tag.id='visitor-nameplate';tag.hidden=true;tag.setAttribute('aria-label','当前角色名字');
 const text=document.createElement('span');tag.append(text);a.hud.append(tag);
 const style=document.createElement('style');style.textContent='#visitor-nameplate{position:absolute;z-index:5;transform:translate(-50%,-100%);max-width:min(160px,calc(100vw - 24px));box-sizing:border-box;padding:0;border:0;border-radius:0;background:none;box-shadow:none;color:#fff;font:500 12px/1.3 system-ui;letter-spacing:.04em;text-shadow:0 1px 2px #0008;pointer-events:none;user-select:none;white-space:nowrap}#visitor-nameplate span{display:block;overflow:hidden;text-overflow:ellipsis}#visitor-nameplate[hidden]{display:none}';a.hud.append(style);
 const seat=a.node.getChildByName('Static seated pose · candidate'),bed=a.node.getChildByName('Complete supine pose'),reach=a.node.getChildByName('Reach and lower complete pose');
 const anchors=new WeakMap(),world=new Vec3(),ndc=new Vec3();let lastName='';
 // Read the chosen head point once per authored pose mesh, retaining its depth correction.
 function posePoint(node,u,v){const renderer=node.getComponent(MeshRenderer),mesh=renderer?.mesh;if(!mesh)return false;let point=anchors.get(mesh);if(!point){
  if(node===seat){const material=renderer.sharedMaterials[0],image=material.getProperty('mainTexture')?.image?.data,t=material.getProperty('tilingOffset');if(image&&t){const w=Math.round(Math.abs(t.x)*image.width),h=Math.round(Math.abs(t.y)*image.height),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,Math.round(Math.min(t.z,t.z+t.x)*image.width),Math.round(Math.min(t.w,t.w+t.y)*image.height),w,h,0,0,w,h);const data=context.getImageData(0,0,w,h).data;let top=h,left=w,right=0;for(let y=0;y<h;y++){let opaque=false;for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>128){opaque=true;if(y<top+h*.10){left=Math.min(left,x);right=Math.max(right,x);}}if(opaque&&top===h)top=y;if(y>top+h*.10)break;}if(top<h){u=(left+right)/(2*w);if(t.x<0)u=1-u;v=1-top/h;}}}
  const ps=mesh.readAttribute(0,gfx.AttributeName.ATTR_POSITION),uv=mesh.readAttribute(0,gfx.AttributeName.ATTR_TEX_COORD);if(!ps||!uv)return false;let best=Infinity,index=0;for(let i=0;i<uv.length/2;i++){const d=(uv[i*2]-u)**2+(uv[i*2+1]-v)**2;if(d<best){best=d;index=i;}}point=new Vec3(ps[index*3],ps[index*3+1],ps[index*3+2]);anchors.set(mesh,point);}node.updateWorldTransform();Vec3.transformMat4(world,point,node.worldMatrix);return true;}
 function draw(){
  const name=String(a.characterName||'').trim();if(name!==lastName){text.textContent=name;tag.title=name;tag.setAttribute('aria-label',name);lastName=name;}
  if(!name||a.transitioning||!a.entered||a.hud.classList.contains('loading')){tag.hidden=true;return;}
  let found=false,pose='standing';
  if(bed?.active){pose='lying';const view=bed.children.find(n=>n.active&&n.name.startsWith('Complete supine view '));if(view)found=posePoint(view,view.name.endsWith(' 0')?.5:.18,.12);}
  else if(seat?.active){pose='seated';found=posePoint(seat,.5,1);}
  else if(reach?.active){pose='reaching';reach.updateWorldTransform();Vec3.transformMat4(world,new Vec3(0,.46,0),reach.worldMatrix);found=true;}
  else if(a.player.active&&a.figure.active){const p=a.player.worldPosition;world.set(p.x,p.y+SceneActions.nativeHeight(a)/Math.cos(50*Math.PI/180),p.z);found=true;}
  if(!found){tag.hidden=true;return;}
  Vec3.transformMat4(ndc,world,a.camera.camera.matViewProj);if(ndc.z<-1||ndc.z>1||Math.abs(ndc.x)>1||Math.abs(ndc.y)>1){tag.hidden=true;return;}
  const rect=document.querySelector('#GameCanvas').getBoundingClientRect(),host=a.hud.getBoundingClientRect(),sx=rect.width/(a.hud.clientWidth||rect.width),sy=rect.height/(a.hud.clientHeight||rect.height);
  const x=(rect.left+(ndc.x+1)*rect.width/2-host.left)/sx,y=(rect.top+(1-ndc.y)*rect.height/2-host.top)/sy-8;
  tag.hidden=false;const half=tag.offsetWidth/2;tag.style.left=Math.max(half+8,Math.min(a.hud.clientWidth-half-8,x))+'px';tag.style.top=y+'px';tag.dataset.pose=pose;
 }
 director.on(Director.EVENT_AFTER_DRAW,draw);a.cleanups.push(()=>{director.off(Director.EVENT_AFTER_DRAW,draw);tag.remove();style.remove();});window.__visitorNameplate={ready:true};draw();
})().catch(e=>console.error('Visitor nameplate:',e));

;
/* Static hosting uses the preserved world epoch; no localhost or unavailable API requests. */
(async()=>{
 while(!window.__lampInteraction?.ready||!window.__tavern?.state().entered)await new Promise(r=>setTimeout(r,100));
 const a=__tavernRoomController,cc=await System.import('cc');
 const data=await(await fetch('/scene-world.json')).json();
 const {installBartenderWorld}=await import('/npc-ui/bartender.js');
 const world=await installBartenderWorld(a,cc,{staticWorld:data});
 const style=document.createElement('style');style.textContent='#tavern-ui #world-clock{top:48px;left:16px;right:auto;text-align:left;place-content:start;min-width:0;padding:0;border:0;background:none;font:15px/1.3 system-ui;text-shadow:0 1px 4px #000;pointer-events:none}#tavern-ui #world-clock small{font-size:11px}';document.head.append(style);
 window.__worldTimeRestored={ready:true,mode:'published-epoch'};
 // The NPC image is only needed on meeting him. Never contend with the entry room.
 let installing=false,done=false,retryAfter=0;
 const timer=setInterval(async()=>{if(done||installing||Date.now()<retryAfter||document.hidden||a.transitioning||window.__priorityCharacterLoading||!world.state||a.room.id!==world.state.npc.room||Math.hypot(a.pos.x-world.state.npc.x,a.pos.z-world.state.npc.z)>Math.max(6,a.camera.orthoHeight*2))return;installing=true;try{await a.characterDownloads.priority(async()=>{await import('/npc/runtime.js');const saved=await(await fetch('/npc/saved-size.json')).json();await __installStoryNPC(a,{savedSize:saved,world});});done=true;clearInterval(timer);}catch(e){retryAfter=Date.now()+10000;console.warn('NPC resources will retry',e);}finally{installing=false;}},1000);
 a.cleanups.push(()=>clearInterval(timer));
})().catch(e=>{console.error('World time setup:',e);window.__simpleInteraction?.notice('世界时间加载失败，请刷新重试');});
