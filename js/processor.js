import Volume from "./volume.js";
import Tracer from "./tracer.js";

let Processor = {};

Processor.tracer = Tracer;

Processor.init = ()=>{
    Processor.tracer.init();

    // Computed focal voxels
    Processor._volumeFocalPoints = new Volume();
    Processor._maxFocHits = 0;
    Processor._bvBB = false;
};

// Set extents for all volumes
Processor.setupVolumesBounds = (bb)=>{
    if (Processor._bvBB) return;
    Processor._volumeFocalPoints.setExtents(bb.min, bb.max);
    
    console.log(APP.Processor._volumeFocalPoints);
    Processor._bvBB = true;
};

Processor.computeFocalFixationsForRecord = (R)=>{
	if (!R) return;

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
                Processor._volumeFocalPoints.setData(R.p, (d)=>{
                    // First hit
                    if (!d) return {
                        hits: 1,
                        n: new THREE.Vector3(data.dir[0],data.dir[1],data.dir[2])
                    };

                    // Non-empty voxel (Data in d)
                    let h = d.hits + 1;
                    if (h > Processor._maxFocHits) Processor._maxFocHits = h;

                    let nor = d.n;
                    nor.x += data.dir[0];
                    nor.y += data.dir[1];
                    nor.z += data.dir[2];

                    return { 
                        hits: h,
                        n: nor
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

	for (let r in APP._records){
		Processor.computeFocalFixationsForRecord(APP._records[r]);
	}

	// Populate foc-points
	let focmats = [];

	let minhits = parseInt( Processor._maxFocHits * 0.1 ); // 0.2
	console.log(minhits, Processor._maxFocHits);

	for (let i=minhits; i<=Processor._maxFocHits; i++){
		let p = (i-minhits)/(Processor._maxFocHits-minhits);

        let mat = APP.matSpriteFocal.clone();
        mat.color   = APP.getHeatColor(p);
        mat.opacity = 0.1 + (p*0.6);

		focmats[i] = mat;
	}

    let vs = vFoc._voxelsize.x;

	vFoc.forEachVoxel((v)=>{
		let mi = v.data.hits;

        let nor = v.data.n;
        if (nor) nor = nor.multiplyScalar(1.0/mi);

		if (mi < minhits) return;

		let H = new THREE.Sprite( focmats[mi] );
		H.raycast = APP.VOID_CAST;

		mi = (mi-minhits)+1;
        mi *= 0.1;

		H.position.copy(v.loc);
        if (nor){
            let of = vs * 0.8;
            H.position.x -= nor.x * of;
            H.position.y -= nor.y * of;
            H.position.z -= nor.z * of;
        }
		//let s = vs * 4.0 * mi;
        let s = vs * 4.0;

        if (APP._bPano) s *= 10.0;

		H.scale.set(s,s,s);

		APP.gFPoints.add(H);

        //Norm
/*
        if (APP._bPano) return;

        let gNorm = new THREE.BufferGeometry().setFromPoints([v.loc, new THREE.Vector3(v.loc.x-nor.x, v.loc.y-nor.y, v.loc.z-nor.z)]);
        let nView = new THREE.Line( gNorm, APP.matDirection);
        nView.raycast = APP.VOID_CAST;
        APP.gFPoints.add(nView);
*/
	});
};

export default Processor;