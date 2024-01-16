
class Record extends THREE.Group {

constructor(rid){
    super();

    this.rid  = rid;
    this.node  = undefined;
    this.marks = undefined;

    this._filterTime = 0.0;
    this._filterTRad = 0.2;
    this._currMarkInd = 0;

    this._tRangeMin = undefined;
    this._tRangeMax = undefined;
    this._tRangeD   = 0.0;

    this._color = APP.recColors[ Object.keys(APP._records).length % APP.recColors.length ];
}

clear(){
    this.marks.clear();
    this.node.clear();
}

getMark(i){
    if (!this.marks) return undefined;

    let marks = this.marks.children;
    return marks[i];
}

getCurrentMark(){
    return this.getMark(this._currMarkInd);
}

generateFromCSVdata(data){
    this.node = ATON.createUINode(this.rid);

    this.marks = ATON.createUINode();
    this.marks.attachTo(this.node);

    let rows = data.split("\n");
    let num = rows.length;
    let values;

    let path = [];

    let matMark = APP.matSpriteMark.clone();
    matMark.color = this._color;

    let matLine = APP.matDirection.clone();
    matLine.color = this._color;

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

            path.push(K.position);

            // UserData
            K.userData.time = t;
            K.userData.nav  = nav;
            K.userData.pos  = [px,py,pz];
            K.userData.dir  = [dx,dy,dz];
            K.userData.fov  = fov;

            // 3D Representation
            let mark = new THREE.Sprite(matMark);            
            K.add(mark);

            if (APP._bPano){
                K.position.set(
                    dx * APP._panoScale,
                    dy * APP._panoScale,
                    dz * APP._panoScale
                );

                mark.scale.setScalar(APP.MARK_SCALE * 50.0);
            }
            else {
                mark.scale.setScalar(APP.MARK_SCALE);
                K.position.set(px,py,pz);
/*
                let gs = new THREE.Mesh( ATON.Utils.geomUnitCube, ATON.MatHub.materials.fullyTransparent);
                gs.scale.set(0.3,0.3,0.3);
                mark.add(gs);
*/

/*
                let conesize = 5.0;
                let gfov = new THREE.ConeGeometry( 0.7*conesize, conesize, 10, 1, true );
                gfov.rotateX(Math.PI*0.5);
                gfov.translate(0,0,-0.5*conesize);
    
                let mfov = new THREE.Mesh( gfov, APP.matFOV );
                mfov.lookAt(-dx, -dy, -dz);

                K.add(mfov);
*/

                let gline = new THREE.BufferGeometry().setFromPoints([APP._vZero, new THREE.Vector3(dx, dy, dz)]);
                K.add( new THREE.Line( gline , matLine) );
            }


            K.enablePicking().setOnHover(()=>{
                //console.log(m)
            });

            this.marks.add(K);

            this._tRangeMax = t;
        }
    }

    this.node.attachTo(APP.gRecords);

    // Path
    let gPath = new THREE.BufferGeometry().setFromPoints( path );
    let mPath = new THREE.Line( gPath, APP.matPath );
    this.node.add(mPath);

    this._tRangeD = (this._tRangeMax - this._tRangeMin);

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
    let marks = this.marks.children;
    let num = marks.length;
    if (num < 1) return;

    if (this._tRangeMax===undefined || this._tRangeMin===undefined) return;

    let t = (this._filterTime - this._tRangeMin) / this._tRangeD;

    this._currMarkInd = parseInt(t*num);

    for (let r=0; r<num; r++){
        let M = marks[r];
        let mt = M.userData.time;

        if (r === this._currMarkInd){
            M.show();
        }
        else M.hide();
    }

}

}

export default Record;