import Volume from "./volume.js";
import Tracer from "./tracer.js";

let Processor = {};

Processor.tracer = Tracer;

Processor.V_ZERO = new THREE.Vector3();

Processor.init = ()=>{
    Processor.tracer.init();

    // Computed focal voxels
    Processor._volumeFocalPoints = new Volume();
    Processor._volumeLocations   = new Volume();

    Processor._maxFocHits = 0;
    Processor._maxLocHits = 0;

    Processor._bvBB = false;

    Processor._listFPstr = "";
};

// Set extents for all volumes
Processor.setupVolumesBounds = (bb)=>{
    if (Processor._bvBB) return;

    Processor._volumeFocalPoints.setExtents(bb.min, bb.max);
    Processor._volumeLocations.setExtents(bb.min, bb.max);
    
    console.log(APP.Processor._volumeFocalPoints);
    Processor._bvBB = true;
};

Processor.setupVolumeBoundsFromScene = ()=>{
		ATON.recomputeSceneBounds();

		let bs = ATON._rootVisible.getBound();
		let bb = new THREE.Box3();
		bs.getBoundingBox(bb);

		APP.Processor.setupVolumesBounds(bb);
};


Processor.computeFocalFixationsForRecord = (R)=>{
	if (!R) return;

    Processor.setupVolumeBoundsFromScene();

	let marks = R.marks.children;

	for (let m in marks){
		let M = marks[m];

		let data = M.userData;

        if (APP._bPano){
            let fp = new THREE.Vector3(data.dir[0],data.dir[1],data.dir[2]).normalize();

            fp.x *= APP._panoScale;
            fp.y *= APP._panoScale;
            fp.z *= APP._panoScale;

            //console.log(fp);

            Processor._listFPstr += fp.x+","+fp.y+","+fp.z+"\n";

            Processor._volumeFocalPoints.setData(fp, (d)=>{
                if (!d) return {
                    hits: 1
                };

                let h = d.hits + 1;
                if (h > Processor._maxFocHits) Processor._maxFocHits = h;

                return {
                    hits: h
                };
            });

        }
        else {
            //APP.Tracer.setOffset(0.1);

            let R = Processor.tracer.trace(
                new THREE.Vector3(data.pos[0],data.pos[1],data.pos[2]), 
                new THREE.Vector3(data.dir[0],data.dir[1],data.dir[2])
            );

            if (R){
                Processor._listFPstr += R.p.x+","+R.p.y+","+R.p.z+"\n";

                Processor._volumeFocalPoints.setData(R.p, (d)=>{
                    // First hit
                    if (!d) return {
                        hits: 1,
                        n: new THREE.Vector3(data.dir[0]*R.d, data.dir[1]*R.d, data.dir[2]*R.d),
                        //d: 0.0
                    };

                    // Non-empty voxel (Data in d)
                    let h = d.hits + 1;
                    if (h > Processor._maxFocHits) Processor._maxFocHits = h;

                    let nor = d.n;
                    nor.x += (data.dir[0]*R.d);
                    nor.y += (data.dir[1]*R.d);
                    nor.z += (data.dir[2]*R.d);

                    //let dist = d.d;
                    //dist += data.dist;

                    return { 
                        hits: h,
                        n: nor,
                        //d: dist
                    };
                });
            }
        }

	}
};

Processor.computeFocalFixationsForLoadedRecords = ()=>{
    let vFoc = Processor._volumeFocalPoints;

	vFoc.clear();
	APP.gFPoints.removeChildren();
    Processor._maxFocHits = 0;

    Processor._listFPstr = "";

	for (let r in APP._records){
		Processor.computeFocalFixationsForRecord(APP._records[r]);
	}

    //if (!Processor._focMats) Processor.populateFocMats(16);

    let minhits = 2; //parseInt( Processor._maxFocHits * 0.1 ); // 0.2

    //ATON.Utils.downloadText(Processor._listFPstr, "fp_"+APP._mksid+".csv"); 

/*
	// Populate foc-points
	let focmats = [];

	let minhits = parseInt( Processor._maxFocHits * 0.2 ); // 0.2
	console.log(minhits, Processor._maxFocHits);

	for (let i=minhits; i<=Processor._maxFocHits; i++){
		let p = (i-minhits)/(Processor._maxFocHits-minhits);

        let mat = APP.matSpriteFocal.clone();
        mat.color   = APP.getHeatColor(p);
        mat.opacity = 0.1 + (p*0.3);

		focmats[i] = mat;
	}
*/

    let vs = vFoc._voxelsize.x;

	vFoc.forEachVoxel((v)=>{
		let mi = v.data.hits;

        let nor = v.data.n;
        if (nor) nor = nor.multiplyScalar(1.0/mi);

		if (mi < minhits) return;

        let j = (mi-minhits)/(Processor._maxFocHits - minhits);
        //j = parseInt(j * (Processor._focMats.length-1));

        let H = new THREE.Sprite( APP.getBlobMat(j) );

		//let H = new THREE.Sprite( focmats[mi] );
		H.raycast = APP.VOID_CAST;

		mi = (mi-minhits)+1;
        mi *= 0.1;

		//H.position.copy(v.loc);
        if (nor){
            let of = vs * 0.8;
            H.position.x -= nor.x * of;
            H.position.y -= nor.y * of;
            H.position.z -= nor.z * of;
        }
		///let s = vs * 4.0 * mi;
        let s = vs * 8.0;
        //let s = nor.length();

        if (APP._bPano) s *= 7.0;

		H.scale.set(s,s,s);
        H.renderOrder = mi;


        let K = ATON.createSemanticNode("focfix"+v.i+"_"+v.j+"_"+v.k);
        K.position.copy(v.loc);
        K.add(H);

		APP.gFPoints.add(K);

        //Norm
        if (!APP._bPano){
            //let gNorm = new THREE.BufferGeometry().setFromPoints([v.loc, new THREE.Vector3(v.loc.x-nor.x, v.loc.y-nor.y, v.loc.z-nor.z)]);
            let gNorm = new THREE.BufferGeometry().setFromPoints([
                Processor.V_ZERO, 
                new THREE.Vector3(-nor.x*0.3, -nor.y*0.3, -nor.z*0.3)
            ]);

            let nView = new THREE.Line( gNorm, APP.matDirection);
            nView.raycast = APP.VOID_CAST;
            K.add(nView);
        }

        // Trigger
        let trigger = new THREE.Mesh( ATON.Utils.geomUnitCube, ATON.MatHub.materials.fullyTransparent);
		trigger.scale.setScalar(vs);
		K.add(trigger);

        K.setOnHover(()=>{
            trigger.material = APP.matVoxel;

            let text = "Focal Fixation - Hits:"+ v.data.hits;
            console.log(text);

            ATON.FE.showSemLabel(text);
            ATON.SUI.setInfoNodeText(text);
            ATON.FE._bSem = true;
        });
/*
        K.setOnSelect(()=>{
            ATON.Nav.requestPOV(
                new ATON.POV().setTarget(v.loc).setPosition(v.loc.x-nor.x, v.loc.y-nor.y, v.loc.z-nor.z)
            );
        });
*/
        K.setOnLeave(()=>{
            trigger.material = ATON.MatHub.materials.fullyTransparent;

            ATON.FE.hideSemLabel();
            ATON.FE._bSem = false;
        });

        K.userData.hits = mi;

        K.enablePicking();
	});
};

Processor.filterFocalFixations = (h)=>{
    for (let c in APP.gFPoints.children){
        const C = APP.gFPoints.children[c];

        const hits = C.userData.hits;
        //console.log(hits)

        if (hits >= h) C.show();
        else C.hide();
    }
};

Processor.blurFocalFixations = ()=>{
    let vFoc = Processor._volumeFocalPoints;

    vFoc.forEachVoxel((V)=>{

        let avg = 0;
        let count = 0;

        for (let x=-1; x<=1; x++){
            for (let y=-1; y<=1; y++){
                for (let z=-1; z<=1; z++){

                    let R = vFoc.getVoxelData(V.i + x, V.j + y, V.k + z);
                    if (R){
                        avg += R.hits;
                        count++;
                    }
                    
                }
            }
        }

    });
};

//========================
// Locations
Processor.computePositionalFixationsForRecord = (R)=>{
	if (!R) return;

    Processor.setupVolumeBoundsFromScene();

	let marks = R.marks.children;

	for (let m in marks){
		let M = marks[m];

		let data = M.userData;

        if (!APP._bPano){

            Processor._volumeLocations.setData(new THREE.Vector3(data.pos[0],data.pos[1],data.pos[2]), (d)=>{
                // First hit
                if (!d) return {
                    hits: 1
                };

                // Non-empty voxel (Data in d)
                let h = d.hits + 1;
                if (h > Processor._maxLocHits) Processor._maxLocHits = h;
/*
                let nor = d.n;
                nor.x += data.dir[0];
                nor.y += data.dir[1];
                nor.z += data.dir[2];
*/
                return { 
                    hits: h
                    //n: nor
                };
            });
        }

	}
};

Processor.computePositionalFixationsForLoadedRecords = ()=>{
    let vLoc = Processor._volumeLocations;

	vLoc.clear();
	APP.gLocFixations.removeChildren();
    Processor._maxLocHits = 0;

    //Processor._listFPstr = "";

	for (let r in APP._records){
		Processor.computePositionalFixationsForRecord(APP._records[r]);
	}

    let minhits = 2; //parseInt( Processor._maxLocHits * 0.1 );

    let vs = vLoc.getVoxelSize().x;

	vLoc.forEachVoxel((v)=>{
		let mi = v.data.hits;

/*
        let nor = v.data.n;
        if (nor) nor = nor.multiplyScalar(1.0/mi);
*/
		if (mi < minhits) return;

        let j = (mi - minhits)/(Processor._maxLocHits - minhits);
        //j = parseInt(j * (Processor._focMats.length-1));

        let H = new THREE.Sprite( APP.getBlobMat(j) );

		//let H = new THREE.Sprite( focmats[mi] );
		H.raycast = APP.VOID_CAST;

		mi = (mi-minhits)+1;
        mi *= 0.1;

		//H.position.copy(v.loc);
/*
        if (nor){
            let of = vs * 0.8;
            H.position.x -= nor.x * of;
            H.position.y -= nor.y * of;
            H.position.z -= nor.z * of;
        }
*/
		//let s = vs * 4.0 * mi;
        let s = vs * 8.0;

        //if (APP._bPano) s *= 7.0;

		H.scale.set(s,s,s);
        H.renderOrder = mi;

        let K = ATON.createSemanticNode("posfix"+v.i+"_"+v.j+"_"+v.k);
        K.position.copy(v.loc);
        K.add(H);

		APP.gLocFixations.add(K);

        // Trigger
        let trigger = new THREE.Mesh( ATON.Utils.geomUnitCube, ATON.MatHub.materials.fullyTransparent);
		//let trigger = new THREE.Mesh( ATON.Utils.geomUnitCube, ATON.MatHub.materials.defUI);
		trigger.scale.setScalar(vs);
		K.add(trigger);

        K.setOnHover(()=>{
            trigger.material = APP.matVoxel;

            let text = "Location Fixation - Hits:"+ v.data.hits;
            console.log(text);

            ATON.FE.showSemLabel(text);
            ATON.SUI.setInfoNodeText(text);
            ATON.FE._bSem = true;
        });

        K.setOnLeave(()=>{
            trigger.material = ATON.MatHub.materials.fullyTransparent;

            ATON.FE.hideSemLabel();
            ATON.FE._bSem = false;
        });

        K.userData.hits = mi;

        K.enablePicking();
	});
};

Processor.filterPositionalFixations = (h)=>{
    for (let c in APP.gLocFixations.children){
        const C = APP.gLocFixations.children[c];

        const hits = C.userData.hits;
        //console.log(hits)

        if (hits >= h) C.show();
        else C.hide();
    }
};

export default Processor;