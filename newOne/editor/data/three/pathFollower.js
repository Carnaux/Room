class PathFollower{
    constructor(){
        this.previewState;
        this.previewEnable = false;
        this.t = 0;
        this.dt = 0.005;
        this.tArr;
        this.objArr;
        this.pathArr;
    }   

    preview(obj, path){
        this.objArr = [];
        for(let i = 0; i < obj.length; i++){
            this.objArr.push(obj[i]);
        }
        this.pathArr = [];
        for(let i = 0; i < path.length; i++){
            this.pathArr.push(path[i]);
        }
    
        for(let i = 0; i < obj.length; i++){
            obj[i].position.copy(path[i].position[0]);
            obj[i].quaternion.copy(path[i].rotationQuat[0]);
        }

        this.previewState = [];
        for(let i = 0; i < obj.length; i++){
            this.previewState.push(0);
        }

        this.tArr = [];
        for(let i = 0; i < obj.length; i++){
            this.tArr.push(0);
        }
        
        this.previewEnable = true;
    }

    update(){
        if(this.previewEnable){
          
            for(let i = 0; i < this.objArr.length; i++){
                
                if(this.pathArr[i].position[this.previewState[i]] != null){

                
                    let currentPos = new THREE.Vector3();
                    currentPos.copy(this.objArr[i].position);
                    let nextPos = new THREE.Vector3();
                    nextPos.copy( this.pathArr[i].position[this.previewState[i]] );


                    let newPos = new THREE.Vector3();
                    newPos.lerpVectors(currentPos, nextPos, this.ease(this.tArr[i]));
                    
            
                    this.objArr[i].quaternion.slerp(this.pathArr[i].rotationQuat[this.previewState[i]], this.ease(this.tArr[i]));
                    this.objArr[i].position.copy(newPos); 
                    

                    this.tArr[i] += this.dt;

                    if(currentPos.equals(nextPos)){
                        this.previewState[i] =  this.previewState[i] + 1;
                        this.tArr[i] = 0;
                    }

                
                }
            }
           
        }
    }

    add(objEl, pathEl, id){
        if(objEl == null){
            for(let i = 0; i < this.objArr.length; i++){
                if(this.objArr[i].id == id){
                    this.pathArr[i] = pathEl;
                    this.tArr[i] = 0;
                    this.previewState[i] = 0;
                    break;
                }
            }
        }else{
            this.objArr.push(objEl);
            this.pathArr.push(pathEl);
            this.previewState.push(0);
            this.tArr.push(0);
        }
        
    }

    ease(t) { return t<0.5 ? 2*t*t : -1+(4-2*t)*t}
}
