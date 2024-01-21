
class Record extends THREE.Group {

constructor(rid){
    super();

    this.rid  = rid;
    this.node  = undefined;
    this.marks = undefined;

    this._filterTime = 0.0;
    this._filterTRad = 0.2;

    this._tRangeMin = undefined;
    this._tRangeMax = undefined;
    this._tRangeD   = 0.0;

    let numCurrentRecs = Object.keys(APP._records).length;
    this._color  = APP.recColors[ numCurrentRecs % APP.recColors.length ];
    this._matSem = APP.recSemMats[ numCurrentRecs % APP.recSemMats.length ];

    this._currMarkInd = 0;
    //this._marks = [];
    //this.setupCursor();

    this._gBookmarks = undefined;
    this._semStorageID = rid;
}

setSemStorageID(ss){
    this._semStorageID = ss;
};

getSemStorage( f ){
    APP.getStorage( this._semStorageID ).then( f );
}

setupCursor(){
    let matMark = APP.matSpriteMark.clone();
    matMark.color = this._color;

    let matLine = APP.matPath.clone();
    matLine.color = this._color;

    this._cursor = ATON.createUINode("cur-"+this.rid);

    // 3D Representation
    let mark = new THREE.Sprite(matMark);
    //mark.raycast = APP.VOID_CAST;
    this._cursor.add(mark);

    if (APP._bPano){
        mark.scale.setScalar(APP.MARK_SCALE * 50.0);
    }
    else {
        mark.scale.setScalar(APP.MARK_SCALE);
        //this._cursor.position.set(px,py,pz);

        let conesize = 5.0;
        let gfov = new THREE.ConeGeometry( 0.7*conesize, conesize, 10, 1, true );
        gfov.rotateX(Math.PI*0.5);
        gfov.translate(0,0,-0.5*conesize);

        let mfov = new THREE.Mesh( gfov, APP.matFOV );
        mfov.lookAt(-dx, -dy, -dz);

        this._cursor.add(mfov);
    }

    this._cursor.enablePicking();

    this._cursor.setOnHover(()=>{
        this._cursor.scale.setScalar(1.5);
        APP._hoverMark = K;

    });
    this._cursor.setOnLeave(()=>{
        this._cursor.scale.setScalar(1);
        APP._hoverMark = undefined;
    });
}

clear(){
    this.removeChildren();
    this.node.removeChildren();
}

getMark(i){
    if (!this.marks) return undefined;

    let marks = this.marks.children;
    return marks[i];
}

getCurrentMark(){
    return this.getMark(this._currMarkInd);
}

getMarkIndex(M){
    if (M.userData.i === undefined) return -1;
    return M.userData.i;
/*
    let num = this.marks.children.length;
    for (let i=0; i<num; i++){
        if (this.marks.children[i]===M) return i;
    }
    return -1;
*/
}

generateFromCSVdata(data){
    this.node = ATON.createUINode(this.rid);
    let self = this;

    this.marks = ATON.createUINode();
    this.marks.attachTo(this.node);

    this._gBookmarks = ATON.createUINode();
    this._gBookmarks.attachTo(this.node);

    let rows = data.split("\n");
    let num = rows.length;
    let values;

    let path = [];

    let matMark = APP.matSpriteMark.clone();
    matMark.color = this._color;

    let matLine = APP.matPath.clone();
    matLine.color = this._color;

    let matfov = APP.matFOV.clone();
    matfov.color = this._color;

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

            
/*
            let MD = {
                time: t,
                nav: nav,
                pos: new THREE.Vector3(px,py,pz),
                dir: new THREE.Vector3(dx,dy,dz),
                fov: fov
            };
            this._marks.push(MD);

            path.push(MD.pos);
*/

            // UserData
            K.userData.i    = path.length;
            K.userData.time = t;
            K.userData.nav  = nav;
            K.userData.pos  = [px,py,pz];
            K.userData.dir  = [dx,dy,dz];
            K.userData.fov  = fov;

            path.push(K.position);

            // 3D Representation
            let mark = new THREE.Sprite(matMark);
            //mark.raycast = APP.VOID_CAST;
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

                // Trigger
/*
                let gs = new THREE.Mesh( ATON.Utils.geomUnitCube, ATON.MatHub.materials.fullyTransparent);
                gs.scale.setScalar(0.3);
                K.add(gs);
*/


                let conesize = 5.0;
                let gfov = new THREE.ConeGeometry( 0.7*conesize, conesize, 10, 1, true );
                gfov.rotateX(Math.PI*0.5);
                gfov.translate(0,0,-0.5*conesize);
    
                let mfov = new THREE.Mesh( gfov, matfov );
                mfov.lookAt(-dx, -dy, -dz);
                mfov.raycast = APP.VOID_CAST;

                K.add(mfov);


                let gDir = new THREE.BufferGeometry().setFromPoints([APP._vZero, new THREE.Vector3(dx, dy, dz)]);
                let dLine = new THREE.Line( gDir, APP.matDirection);
                dLine.raycast = APP.VOID_CAST;
                K.add( dLine );
            }


            K.enablePicking();
            K.setOnHover(()=>{
                K.scale.setScalar(1.5);
                APP._hoverMark = K;

            });
            K.setOnLeave(()=>{
                K.scale.setScalar(1);
                APP._hoverMark = undefined;
            });

            this.marks.add(K);

            K.hide();

            this._tRangeMax = t;
        }
    }

    this.node.attachTo(APP.gRecords);

    // Path
    let gPath = new THREE.BufferGeometry().setFromPoints( path );
    //let gPath = new THREE.LineGeometry().setFromPoints( path );
    let mPath = new THREE.Line( gPath, matLine );
    mPath.raycast = APP.VOID_CAST;

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

getPOVforMark = (M)=>{
    let kd = M.userData;
    if (!kd) return undefined;

    let T = new THREE.Vector3();
    T.set(
        M.position.x + kd.dir[0],
        M.position.y + kd.dir[1],
        M.position.z + kd.dir[2], 
    );
    
    let pov = new ATON.POV();
    if (!APP._bPano) pov.setPosition(M.position);
    pov.setTarget(T);

    return pov;
};

getOrCreateBookmark(i){
    let bid = "bm-"+this.rid+"-"+i;

    let B = ATON.getSemanticNode(bid);
    if (B) return B;

    let M = this.getMark(i);

    let r = 0.2;
    if (APP._bPano) r *= 20.0;

    B = ATON.SemFactory.createSphere(bid, M.position, r);

    B.attachTo(this._gBookmarks);

    B.setDefaultAndHighlightMaterials(this._matSem, APP.recSemMatHL);
    B.restoreDefaultMaterial();

    B.userData.mark = M;

    return B;
}

saveBookmark(i, content, audio){
    if (!content) return;
    if (content.length < 1) return; 

    let B = this.getOrCreateBookmark(i);

    let O = {};
    O.bookmarks = {};
    O.bookmarks[i] = {};
    O.bookmarks[i].content = content;

    APP.addToStorage( this._semStorageID, O ); //.then(...)
}

}

export default Record;