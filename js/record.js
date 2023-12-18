
class Record extends THREE.Group {

constructor(rid){
    super();

    this.rid  = rid;
    this.node = undefined;

    this._filterTime = 0.0;
    this._filterTRad = 0.2;
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
            let px = parseFloat(values[2]);
            let py = parseFloat(values[3]);
            let pz = parseFloat(values[4]);


            let mark = APP.mark.clone();
            mark.position.set(px,py,pz);
            mark.scale.set(APP.MARK_SCALE,APP.MARK_SCALE,APP.MARK_SCALE);

            mark.userData.time = t;

            this.node.add(mark);
        }
    }

    this.node.attachTo(APP.gRecords);

    console.log(this.node)

    return this;
}

loadViaAPI( onComplete ){
    let self = this;
    let sid = ATON.SceneHub.currID;
    sid = sid.replace("/","-");

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

        if (mt >= tA && mt <= tB) M.visible = true;
        else M.visible = false; 
    }

}

}

export default Record;