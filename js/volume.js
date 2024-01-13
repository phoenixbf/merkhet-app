class Volume {

constructor(){  
    this._v = {};

    this._bb = new THREE.Box3();
    this._bbSize = new THREE.Vector3();

    this._res = 256;
    this._voxelsize = new THREE.Vector3();
}

clear(){
    this._v = {}; 
};

setExtents(exmin, exmax){
    this._bb.set(exmin,exmax);
    this._bb.getSize(this._bbSize);

    this._voxelsize.x = this._bbSize.x / this._res;
    this._voxelsize.y = this._bbSize.y / this._res;
    this._voxelsize.z = this._bbSize.z / this._res;
}

getVoxelData(i,j,k){
    let V = this._v;
    
    if (V[i] === undefined) return undefined;
    if (V[i][j] === undefined) return undefined;
    if (V[i][j][k] === undefined) return undefined;

    let D = V[i][j][k];

    return D;
}

setVoxelData(i,j,k, D){
    let V = this._v;

    if (V[i] === undefined) this._v[i] = {};
    if (V[i][j] === undefined) this._v[i][j] = {};
    
    this._v[i][j][k] = D;
    
    return this;
}

hash(loc){
    if (!this._bb.containsPoint(loc)) return undefined;

    let i = (loc.x - this._bb.min.x)/this._bbSize.x;
    let j = (loc.y - this._bb.min.y)/this._bbSize.y;
    let k = (loc.z - this._bb.min.z)/this._bbSize.z;

    i = parseInt(i * this._res);
    j = parseInt(j * this._res);
    k = parseInt(k * this._res);

    let R = {};
    R.i = i;
    R.j = j;
    R.k = k;

    return R;
}

setData(loc, D){
    let R = this.hash(loc);
    if (!R) return this;

    if (typeof D === 'function'){
        let val = this.getVoxelData(R.i,R.j,R.k);
        this.setVoxelData(R.i,R.j,R.k, D(val));
    }
    else this.setVoxelData(R.i,R.j,R.k, D);
}

getData(loc){
    let R = this.hash(loc);
    if (!R) return undefined;

    return this.getVoxelData(R.i,R.j,R.k);
}

getVoxelLocation(i,j,k){
    let x = parseFloat(i/this._res);
    let y = parseFloat(j/this._res);
    let z = parseFloat(k/this._res);

    x = (x*this._bbSize.x) + this._bb.min.x;
    y = (y*this._bbSize.y) + this._bb.min.y;
    z = (z*this._bbSize.z) + this._bb.min.z;

    x += (this._voxelsize.x * 0.5);
    y += (this._voxelsize.y * 0.5);
    z += (this._voxelsize.z * 0.5);

    return new THREE.Vector3(x,y,z);
}

// Retrieve all non-empty voxels into list (array)
forEachVoxel(f){
    let count = 0;

    for (let i in this._v){
        for (let j in this._v[i]){
            for (let k in this._v[i][j]){
                let D = this._v[i][j][k];
                let loc = this.getVoxelLocation(i,j,k);

                f({
                    i: parseInt(i),
                    j: parseInt(j),
                    k: parseInt(k),
                    loc: loc,
                    data: D
                });

                count++;
            }
        }

    }

    return count;
}

}

export default Volume;