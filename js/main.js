/*
	Main js entry for Merkhet App

===============================================*/
import Record from "./record.js";
import Processor from "./processor.js";
import UI from "./ui.js";


let APP = ATON.App.realize();
window.APP = APP;

APP.MKHET_API  = "/mkhet/";
APP.DIR_ASSETS = APP.basePath + "assets/";
APP.MARK_SCALE = 0.5;

APP.VOID_CAST = (rc, hitlist)=>{};

// Classes/Components
APP.Record    = Record;
APP.UI        = UI;
APP.Processor = Processor;



APP.getSceneMerkhetID = (sid)=>{
	if (!sid) sid = ATON.SceneHub.currID;

	return sid.replace("/","-");
};

// APP.setup() is required for web-app initialization
// You can place here UI setup (HTML), events handling, etc.
APP.setup = ()=>{
	APP._records = {};
	APP._currRID = undefined;

	APP._vZero = new THREE.Vector3(0,0,0);
	
	APP._panoScale = 50.0;
	APP._bPano = false;
	APP._bbPano = new THREE.Box3(
		new THREE.Vector3(-APP._panoScale,-APP._panoScale,-APP._panoScale),
		new THREE.Vector3(APP._panoScale,APP._panoScale,APP._panoScale)
	);

    ATON.FE.realize(); // Realize the base front-end

	ATON.FE.addBasicLoaderEvents(); // Add basic events handling

	//ATON.SUI.enableSemIcons();

	APP.UI.init();
	APP.Processor.init();

	let sid = APP.params.get("s");
	if (!sid) return;


	ATON.FE.loadSceneID(sid);

	APP.gRecords = ATON.createUINode("records");
	APP.gRecords.attachToRoot();

	APP.gFPoints = ATON.createUINode("focalpoints");
	APP.gFPoints.attachToRoot();
	
	APP.gProcessed = ATON.createSemanticNode("processed");
	APP.gProcessed.attachToRoot();

	ATON._bqSem = true;

	//ATON.SUI.showSelector(false);

	APP.setupEvents();
	APP.setupAssets();

	APP._mksid = APP.getSceneMerkhetID(sid);

	let procData = APP.params.get("p");
	if (procData) APP.loadProcessedData(APP.MKHET_API+"r/"+ APP._mksid +"/"+procData);

	APP._hoverMark = undefined;
};


APP.setupAssets = ()=>{
	APP.matSpriteMark = new THREE.SpriteMaterial({ 
        map: new THREE.TextureLoader().load( APP.DIR_ASSETS + "mark.png" ),
        
		transparent: true,
        //opacity: 0.5,
        
		color: ATON.MatHub.colors.blue,
        depthWrite: false, 
        //depthTest: false
        
		//blending: THREE.AdditiveBlending
		toneMapped: false
    });

	APP.matSpriteFocal = new THREE.SpriteMaterial({ 
		map: APP.matSpriteMark.map,
		
		transparent: true,
		opacity: 1.0,
		
		color: ATON.MatHub.colors.green,
		depthWrite: false, 
		//depthTest: false,
		
		//blending: THREE.AdditiveBlending,
		toneMapped: false
	});

	APP.mark = new THREE.Sprite(APP.matSpriteMark);

	APP.matDirection = new THREE.MeshBasicMaterial({
        color: ATON.MatHub.colors.white,
        //linewidth: 5,
        transparent: true,
        depthWrite: false,
        opacity: 0.5, 
        //depthTest: false
        //flatShading: true
		toneMapped: false
    });

/*
	APP.matPath = new THREE.LineMaterial( {
		color: ATON.MatHub.colors.blue,
		linewidth: 5, // in world units with size attenuation, pixels otherwise
		//vertexColors: true,

		//resolution:  // to be set by renderer, eventually
		dashed: false,
		alphaToCoverage: true,
	});
*/
	APP.matPath = new THREE.MeshBasicMaterial({
        color: ATON.MatHub.colors.blue,

        transparent: true,
        depthWrite: false,
        opacity: 0.2,
		//side: THREE.DoubleSide,

		toneMapped: false
    });

	APP.matFOV = new THREE.MeshBasicMaterial({
		map: new THREE.TextureLoader().load( APP.DIR_ASSETS + "fov.png" ),
        color: ATON.MatHub.colors.green,

		transparent: true,
        depthWrite: false,
        opacity: 0.1,
		side: THREE.DoubleSide,
        //depthTest: false
        //flatShading: true
		toneMapped: false
    });

	// Heat Gradient
	APP.heatGradientColors = []; // G to R

	for (let i=0; i<32; i++){
		let t = parseFloat(i/32.0);

		let col = new THREE.Color();
		col.r = 2.0 * t;
		col.g = 2.0 * (1.0 - t);
		col.b = 0.0;

		if (col.r > 1.0) col.r = 1.0;
		if (col.g > 1.0) col.g = 1.0;

		APP.heatGradientColors.push(col);
	}

	// Records colors
	APP.recColors = [
		new THREE.Color(0,0,1),
		new THREE.Color(1,0,1),
		new THREE.Color(0,1,1),
	];
	
	APP.recSemMats = [];
	for (let c=0; c<APP.recColors.length; c++){
		let col = APP.recColors[c];

		let mat = ATON.MatHub.materials.defUI.clone();
		mat.uniforms.tint.value    = col;
		mat.uniforms.opacity.value = 0.3;

/*
	let mat = new THREE.MeshPhysicalMaterial({
			color: col,
			roughness: 0.3,
			metalness: 0,
			transmission: 1,
			ior: 1.3,
			thickness: 2.0,

			transparent: true,
			depthWrite: false
		});
*/
		APP.recSemMats.push(mat);
	}

	APP.recSemMatHL = ATON.MatHub.materials.defUI.clone();
	APP.recSemMatHL.uniforms.tint.value = ATON.MatHub.colors.white;
	APP.recSemMatHL.uniforms.opacity.value = 0.3;

/*
	APP.recSemMatHL = new THREE.MeshPhysicalMaterial({
		color: ATON.MatHub.colors.white,
		roughness: 0.3,
		metalness: 0,
		transmission: 1,
		ior: 1.3,
		thickness: 2.0,

		transparent: true,
		depthWrite: false
	});
*/
};

APP.getHeatColor = (t)=>{
	if (t<0.0) t = 0.0;
	if (t>1.0) t = 1.0;

	let i = parseInt(t * (APP.heatGradientColors.length-1));
	return APP.heatGradientColors[i];
};

APP.setPanoramicMode = (b)=>{
	APP._bPano = b;

    if (b){
        APP.Processor.setupVolumesBounds(APP._bbPano);

        console.log("Panoramic Mode");
    }
};

APP.setTime = (t)=>{
	let R = APP.getActiveRecord();
	if (!R) return;

	R._filterTime = t;
	R.filter();

/*
	for (let r in APP._records){
		APP._records[r]._filterTime = t;
		APP._records[r].filter();
	}
*/
};

APP.rewindTimeForActiveRecord = ()=>{
	let R = APP.getActiveRecord();
	if (!R) return;

	R._filterTime = R._tRangeMin;
	R.filter();
};

APP.detectPanoramicScene = ()=>{
	let sd = ATON.SceneHub.currData;

	if (!sd.environment || !sd.environment.mainpano) return false;

	if (!sd.scenegraph) return true;

	let snodes = sd.scenegraph.nodes;
	if (!snodes) return true;

	for (let n in snodes){
		if (snodes[n] && snodes[n].urls) return false;
	}

	return true;
};

APP.setActiveRecord = (rid)=>{
	let R = APP._records[rid];
	console.log(rid)

	if (!R) return;

	for (let r in APP._records){
		if (r!==rid) APP._records[r].switch(false);
	}

	APP._currRID = rid;
	APP._hoverMark = undefined;

	$("#tSlider").attr("min", R._tRangeMin);
	$("#tSlider").attr("max", R._tRangeMax);
	$("#tSlider").val(R._tRangeMin);
	$("#rBookmarks").html("");

	R.switch(true);

	APP.rewindTimeForActiveRecord();

	// Semantic
	let numMarks = R.marks.children.length;
	R.setSemStorageID( APP.getRecordSemStorageID(rid) );
	R.getSemStorage((s)=>{
		//let bopts = "";
		for (let b in s.bookmarks){
			let O = s.bookmarks[b];
			let i = parseInt(b);

			R.getOrCreateBookmark( i );
/*
			let vv = (i/numMarks) * (R._tRangeMax - R._tRangeMin);
			vv += R._tRangeMin;

			bopts += "<option value='"+parseInt(vv)+"' label='"+i+"'></option>";
*/
		}

		//$("#rBookmarks").html(bopts);
	});

	console.log("Active Record: "+rid);
};

APP.getActiveRecord = ()=>{
	return APP._records[APP._currRID];
};

APP.loadRecord = (rid)=>{

	let R = new APP.Record(rid);
	R.loadViaAPI(()=>{
		let strcol = "rgba("+R._color.r*127+","+R._color.g*127+","+R._color.b*127+",0.5)";

		console.log(R._tRangeMin+","+R._tRangeMax);

		$("#tSlider").attr("min", R._tRangeMin);
		$("#tSlider").attr("max", R._tRangeMax);
		$("#tSlider").val(R._tRangeMin);

		$("#recTabs").append("<div id='tabrec-"+rid+"' class='tabRecord' style='background-color: "+strcol+"' onclick=\"APP.setActiveRecord('"+rid+"')\">"+rid+"</div>");

		APP._records[rid] = R;

		APP.setActiveRecord(rid);
	});
};

APP.getRecordSemStorageID = (rid)=>{
	if (!APP._mksid) return rid;
	return APP._mksid+"_"+rid;
};

APP.setupEvents = ()=>{
	// Keyboard
	ATON.on("KeyPress", (k)=>{
		//if (k==='ArrowRight') 
        //if (k==='ArrowLeft') 
	});

	ATON.on("Tap", (e)=>{
		if (APP._hoverMark){
			APP.UI.popupMark(APP._hoverMark);
			return;
		}

		let annMark = ATON.getHoveredSemanticNode();
		if (annMark){
			APP.UI.popupMark( annMark.userData.mark );
		}

	});

	ATON.on("SceneJSONLoaded", sid =>{

		// Detect 360
		APP.setPanoramicMode( APP.detectPanoramicScene() );

		let rid = APP.params.get("r");
		if (!rid) return;

		APP.loadRecord(rid);
	});

	ATON.on("AllNodeRequestsCompleted",()=>{
		if (APP._bPano) return;

		let bs = ATON._rootVisible.getBound();
		let bb = new THREE.Box3();
		bs.getBoundingBox(bb);

		APP.Processor.setupVolumesBounds(bb);

		ATON.Nav.setOrbitControl();

		APP.setupScene();
	});

	ATON.on("MainPano", ()=>{
		APP.setupScene();
	});

	ATON.EventHub.clearEventHandlers("SemanticNodeHover");
    ATON.on("SemanticNodeHover", (semid)=>{
        let S = ATON.getSemanticNode(semid);
        if (!S) return;

		let ud = S.userData;
		if (!ud){
			ATON.FE.showSemLabel(semid);
			ATON.FE._bSem = true;
	
			S.highlight();
			return;
		}

		let mark = ud.mark;
		if (!mark) return;

		let m = mark.userData.i;

        ATON.FE.showSemLabel("#"+m+" (T: "+mark.userData.time+")");
        ATON.FE._bSem = true;

        S.highlight();
        
		//$('canvas').css({ cursor: 'crosshair' });
        //if (ATON.SUI.gSemIcons) ATON.SUI.gSemIcons.hide();
    });

	ATON.EventHub.clearEventHandlers("SemanticNodeLeave");
    ATON.on("SemanticNodeLeave", (semid)=>{
        let S = ATON.getSemanticNode(semid);
        if (!S) return;

        ATON.FE.hideSemLabel();
        ATON.FE._bSem = false;

        S.restoreDefaultMaterial();

        //$('canvas').css({ cursor: 'grab' });
        //if (ATON.SUI.gSemIcons) ATON.SUI.gSemIcons.show();
    });

	// Collaborative
	//===========================================
	ATON.Photon.on("MKH_Time", (t)=>{
		//if (!APP._record) return;

		t = parseFloat(t);

		$("#tSlider").val(t);
		$("#tValue").html(t);

		APP.setTime(t);
	});
};

/* APP.update() if you plan to use an update routine (executed continuously)
APP.update = ()=>{

};
*/

APP.setupScene = ()=>{
	APP.uniforms = {
		tVol: { type:'t' },
		tVolMin: { type:'vec3', value: new THREE.Vector3(-7,-5,-7) },
		tVolMax: { type:'vec3', value: new THREE.Vector3(7,10,7) },
	};

	let visitor = ( o ) => {
		if (o.material){
			let M = new CustomShaderMaterial({
				baseMaterial: o.material,
				uniforms: APP.uniforms,

				vertexShader:`
					varying vec3 vPositionW;
					varying vec3 vNormalW;
					varying vec3 vNormalV;
		
					varying vec2 sUV;
		
					void main(){
						sUV = uv;
		
						vPositionW = ( modelMatrix * vec4( position, 1.0 )).xyz;
						vNormalV   = normalize( vec3( normalMatrix * normal ));
						vNormalW   = (modelMatrix * vec4(normal, 0.0)).xyz;
		
						gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
					}
				`,

				fragmentShader:`
					precision highp sampler3D;

					varying vec3 vPositionW;
		
					varying vec3 vNormalW;
					varying vec3 vNormalV;
					varying vec2 sUV;

					uniform sampler3D tVol;
					uniform vec3 tVolMin;
					uniform vec3 tVolMax;

					void main(){
						vec4 baseCol = csm_DiffuseColor;
/*
						vec3 voxelPosition = (vPositionW - tVolMin) / (tVolMax - tVolMin);
						//voxelPosition.x = 1.0 - voxelPosition.x;
						//voxelPosition.y = 1.0 - voxelPosition.y;
						//voxelPosition.z = 1.0 - voxelPosition.z;

						vec3 voxelColor = texture(tVol, voxelPosition.xyz).rgb;

						//csm_DiffuseColor = baseCol;
						csm_DiffuseColor.rgb = voxelColor;
*/
						float v = (baseCol.r + baseCol.g + baseCol.b)/3.0;
						csm_DiffuseColor.rgb = vec3(v);
					}
				`
			});

			o.material = M;
		}
	};

	ATON.getRootScene().traverse( visitor );
	if (ATON._mMainPano) ATON._mMainPano.traverse( visitor );
};

APP.loadProcessedData = (path)=>{
	$.getJSON( path, ( data )=>{
        console.log("Loaded density data: "+path);

		let points = data.points;
		let scale  = data.voxelsize * 4.0; // * 8.0;
		//let scale  = data.voxelsize;

		if (APP._bPano) scale *= 1.5;

		if (!points) return;

		let maxdens = points[0].density;

		let maxcount = Math.min(500, points.length);
		console.log(maxcount)

		//let texmark = new THREE.TextureLoader().load( APP.DIR_ASSETS + "mark.png" );
		let maxcolor = new THREE.Color(1, 0, 0);

		for (let p=0; p<maxcount; p++){
			let P = points[p];
			let px = P.x;
			let py = P.y;
			let pz = P.z;
			let d  = P.density;

			if (APP._bPano){
				px *= APP._panoScale;
				py *= APP._panoScale;
				pz *= APP._panoScale;
				//scale *= 2.0;
			}

			if (py === undefined) py = 0.0;

			let dp = parseFloat(p) / parseFloat(maxcount);
			//console.log(dp)

			let K = ATON.createSemanticNode("d"+d);
			K.position.set(px,py,pz);

			let o = (d / maxdens) * 0.3;

/*
			// cubes
			let mat = new THREE.MeshBasicMaterial({
				color: maxcolor.lerp(ATON.MatHub.colors.green, dp),
				transparent: true,
				depthWrite: false,
				opacity: o,
				//blending: THREE.AdditiveBlending
			});

			let mark = new THREE.Mesh( ATON.Utils.geomUnitCube, mat);
			mark.scale.set(scale,scale,scale);
			K.add(mark);
*/
			
			// Blobs
			let mat = new THREE.SpriteMaterial({ 
				map: APP.matSpriteMark.map,
				
				transparent: true,
				opacity: o,
				
				color: APP.getHeatColor(1.0 - dp), //maxcolor.lerp(ATON.MatHub.colors.green, dp),
				depthWrite: false, 
				//depthTest: false
				
				//blending: THREE.MultiplicativeBlending
				toneMapped: false

			});

            let mark = new THREE.Sprite(mat);
			mark.raycast = APP.VOID_CAST;
			
			//let scale = 5.0; //(o * 5.0) / maxdens;
			mark.scale.setScalar(scale);

            K.add(mark);

			let trigger = new THREE.Mesh( ATON.Utils.geomUnitCube, ATON.MatHub.materials.fullyTransparent);
			trigger.scale.set(0.2,0.2,0.2);
			K.add(trigger)


            K.setOnHover(()=>{
                //console.log("density:" + d);
				mat.opacity = o*2.0;
				//mark.scale.setScalar(scale*2.0);

				let text = "Density: "+d.toFixed(4);
				console.log(text);

				ATON.FE.showSemLabel(text);
				ATON.SUI.setInfoNodeText(text);
				ATON.FE._bSem = true;
            });

			K.setOnLeave(()=>{
				mat.opacity = o;
				//mark.scale.setScalar(scale);

				ATON.FE.hideSemLabel();
				ATON.FE._bSem = false;
			});

			K.attachTo(APP.gProcessed);

			K.enablePicking();
		}
	});
};


// Run the App
window.addEventListener('load', ()=>{
	APP.run();
});
