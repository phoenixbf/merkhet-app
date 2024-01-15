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
	
	APP._panoScale = 100.0;
	APP._bPano = false;
	APP._bbPano = new THREE.Box3(
		new THREE.Vector3(-APP._panoScale,-APP._panoScale,-APP._panoScale),
		new THREE.Vector3(APP._panoScale,APP._panoScale,APP._panoScale)
	);

    ATON.FE.realize(); // Realize the base front-end

	ATON.FE.addBasicLoaderEvents(); // Add basic events handling

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
		depthTest: false,
		
		blending: THREE.AdditiveBlending,
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

	APP.matPath = new THREE.MeshBasicMaterial({
        color: ATON.MatHub.colors.blue,

        transparent: true,
        depthWrite: false,
        opacity: 1.0,

		toneMapped: false
    });

	APP.matFOV = new THREE.MeshBasicMaterial({
		map: new THREE.TextureLoader().load( APP.DIR_ASSETS + "fov.png" ),
        color: ATON.MatHub.colors.green,

		transparent: true,
        depthWrite: false,
        opacity: 0.1, 
        //depthTest: false
        //flatShading: true
		toneMapped: false
    });
};

APP.setPanoramicMode = (b)=>{
	APP._bPano = b;

    if (b){
        APP.Processor.setupVolumesBounds(APP._bbPano);

        console.log("Panoramic Mode");
    }
};

APP.getActiveRecord = ()=>{
	return APP._records[APP._currRID];
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

APP.setupEvents = ()=>{
	// Keyboard
	ATON.on("KeyPress", (k)=>{
		//if (k==='ArrowRight') 
        //if (k==='ArrowLeft') 
	});

	ATON.on("SceneJSONLoaded", sid =>{

		// Detect 360
		APP.setPanoramicMode( APP.detectPanoramicScene() );

		let rid = APP.params.get("r");
		if (!rid) return;

		let R = new APP.Record(rid);
		R.loadViaAPI(()=>{
			console.log(R._tRangeMin+","+R._tRangeMax);

			$("#tSlider").attr("min", R._tRangeMin);
			$("#tSlider").attr("max", R._tRangeMax);
		});

		APP._records[rid] = R;
		APP._currRID = rid;
	});

	ATON.on("AllNodeRequestsCompleted",()=>{
		if (APP._bPano) return;

		let bs = ATON._rootVisible.getBound();
		let bb = new THREE.Box3();
		bs.getBoundingBox(bb);

		APP.Processor.setupVolumesBounds(bb);

		ATON.Nav.setOrbitControl();
	});

	// Collaborative
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

APP.loadProcessedData = (path)=>{
	$.getJSON( path, ( data )=>{
        console.log("Loaded occupancy data: "+path);

		let points = data.points;
		let scale  = data.voxelsize * 4.0; // * 8.0;
		//let scale  = data.voxelsize;

		if (!points) return;

		let maxdens = points[0].density;

		let maxcount = Math.min(300, points.length);
		console.log(maxcount)

		let texmark = new THREE.TextureLoader().load( APP.DIR_ASSETS + "mark.png" );
		let maxcolor = new THREE.Color(1, 0, 0);

		for (let p=0; p<maxcount; p++){
			let P = points[p];
			let px = P.x;
			let py = P.y;
			let pz = P.z;
			let d  = P.density;

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
				map: texmark,
				
				transparent: true,
				opacity: o,
				
				color: maxcolor.lerp(ATON.MatHub.colors.green, dp),
				depthWrite: false, 
				//depthTest: false
				
				//blending: THREE.MultiplicativeBlending
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
            });

			K.setOnLeave(()=>{
				mat.opacity = o;
				//mark.scale.setScalar(scale);

				ATON.FE.hideSemLabel();
				//ATON.FE._bSem = false;
			});

			K.attachTo(APP.gProcessed);

			K.enablePicking();
		}
	});
};

/*
APP.computeFocalPointsForLoadedRecords = ()=>{
	APP._maxFocHits = 0;

	APP._volumeFocalPoints.clear();
	APP.gFPoints.clear();

	for (let r in APP._records){
		APP.computeFocalPointsForRecord(APP._records[r]);
	}

	// Populate foc-points
	let vs = APP._volumeFocalPoints._voxelsize.x;
	let texmark = new THREE.TextureLoader().load( APP.DIR_ASSETS + "mark.png" );

	let focmats = [];

	let minhits = parseInt(APP._maxFocHits*0.2);
	console.log(minhits,APP._maxFocHits);

	for (let i=minhits; i<=APP._maxFocHits; i++){
		let p = (i-minhits)/(APP._maxFocHits-minhits);

		let mat = new THREE.SpriteMaterial({ 
			map: texmark,
			
			transparent: true,
			opacity: p,
			
			color: new THREE.Color(p, 1.0-p, 0),
			depthWrite: false, 
			depthTest: false,
			
			blending: THREE.AdditiveBlending
		});

		focmats[i] = mat;
	}

	APP._volumeFocalPoints.forEachVoxel((v)=>{
		let mi = v.data.hits;

		if (mi < minhits) return;

		let H = new THREE.Sprite( focmats[mi] );
		H.raycast = APP.VOID_CAST;

		mi = (mi-minhits)+1;

		H.position.copy(v.loc);
		let s = vs * 4.0 * mi;
		H.scale.set(s,s,s);

		APP.gFPoints.add(H);
	});
};

APP.computeFocalPointsForRecord = (R)=>{
	if (!R) return;

	let marks = R.marks.children;

	for (let m in marks){
		let M = marks[m];

		let data = M.userData;
		//console.log(data);

		//APP.Tracer.setOffset(0.1);

		let R = APP.Tracer.trace(
			new THREE.Vector3(data.pos[0],data.pos[1],data.pos[2]), 
			new THREE.Vector3(data.dir[0],data.dir[1],data.dir[2])
		);

		if (R){
			APP._volumeFocalPoints.setData(R.p, (d)=>{
				if (!d) return {
					hits: 1,
					//n: R.n
				};

				let h = d.hits + 1;
				if (h > APP._maxFocHits) APP._maxFocHits = h;

				return { 
					hits: h,
					//n: R.n
				};
			});
		}
	}
};
*/

// Run the App
window.addEventListener('load', ()=>{
	APP.run();
});
