
class Record extends THREE.Group {

constructor(rid){
    super();

    this.rid  = rid;
    this.node = undefined;

    this._filterTime = 0.0;
    this._filterTRad = 0.2;

    this._tRangeMin = undefined;
    this._tRangeMax = undefined;
}

generateFromCSVdata(data){
    this.node = ATON.createUINode(this.rid);

    let rows = data.split("\n");
    let num = rows.length;
    let values;

    //console.log(rows)

    for (let m=1; m<num; m++){
        let M = rows[m];

        values = M.split(",");
        
        let t = parseFloat(values[0]);

        if (!isNaN(t)){
            if (this._tRangeMin===undefined) this._tRangeMin = t;

            let nav = values[1];

            let px = parseFloat(values[2]);
            let py = parseFloat(values[3]);
            let pz = parseFloat(values[4]);

            let dx = parseFloat(values[5]);
            let dy = parseFloat(values[6]);
            let dz = parseFloat(values[7]);

            let fov = parseFloat(values[11]);

            let K = ATON.createUINode(this.rid+"-m"+m);
            K.position.set(px,py,pz);

            // UserData
            K.userData.time = t;
            K.userData.nav  = nav;
            K.userData.pos  = [px,py,pz];
            K.userData.dir  = [dx,dy,dz];
            K.userData.fov  = fov;

            // 3D Representation
            let mark = APP.mark.clone();
            //mark.position.set(px,py,pz);
            mark.scale.set(APP.MARK_SCALE,APP.MARK_SCALE,APP.MARK_SCALE);
            K.add(mark);
/*
            let gs = new THREE.Mesh( ATON.Utils.geomUnitCube, ATON.MatHub.materials.fullyTransparent);
            gs.scale.set(0.3,0.3,0.3);
            mark.add(gs);
*/


            let conesize = 5.0;
            let gfov = new THREE.ConeGeometry( 0.7*conesize, conesize, 10, 1, true );
            gfov.rotateX(Math.PI*0.5);
            gfov.translate(0,0,-0.5*conesize);
 
            let mfov = new THREE.Mesh( gfov, APP.matFOV );
            mfov.lookAt(-dx, -dy, -dz);

            K.add(mfov);


            let gline = new THREE.BufferGeometry().setFromPoints([APP._vZero, new THREE.Vector3(dx, dy, dz)]);
            K.add( new THREE.Line( gline , APP.matDirection) );

            K.enablePicking().setOnHover(()=>{
                //console.log(m)
            });

            this.node.add(K);

            this._tRangeMax = t;
        }
    }

    this.node.attachTo(APP.gRecords);

    console.log(this.node)

    return this;
}

loadViaAPI( onComplete ){
    let self = this;
    let sid = APP.getSceneMerkhetID(ATON.SceneHub.currID);

    $.get(APP.MKHET_API+"r/"+sid+"/"+self.rid, (data)=>{
        self.generateFromCSVdata(data);
        if (onComplete) onComplete();
    });

    return self;
}

loadFromCSVurl(url, onComplete){
    let self = this;

    $.get(url, (data)=>{
        self.generateFromCSVdata(data);
        if (onComplete) onComplete();
    });

    return self;
}

filter(){
    let marks = this.node.children;
    let num = marks.length;

    let tA = this._filterTime - this._filterTRad;
    let tB = this._filterTime + this._filterTRad;

    //console.log(tA+","+tB)

    for (let r=0; r<num; r++){
        let M = marks[r];
        let mt = M.userData.time;

        if (mt >= tA && mt <= tB) M.show();
        else M.hide();
    }

}

}

export default Record;