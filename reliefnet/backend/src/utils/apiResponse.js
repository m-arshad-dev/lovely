function success(type , data={}){
    return {
        success: true,
        type,
        data,
        errors: null
    }
}

function fail(type, error = {}) {
    return {
        success: false,
        type,
        error
    };
}


module.exports ={
    success,
    fail
}