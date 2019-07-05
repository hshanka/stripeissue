import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class ApiProvider {
  private baseURL = ' https://6jesung7pi.execute-api.us-east-1.amazonaws.com/dev';
  private token = '';
  private headers;
  /**
   * constructor - description
   *
   * @param  {type} public http: HttpClient description
   * @return {type}                         description
   */
  constructor(public http: HttpClient) {
    this.headers = new HttpHeaders({
      "Accept":"application/json",
      // "Access-Control-Allow-Origin": "*",
      // "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
      // "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token"
    });
  }


  /**
   * setBaseUrl - description
   *
   * @param  {type} url:string description
   * @return {type}            description
   */
  setBaseUrl(url: string) {
    this.baseURL = url;
  }


  /**
   * setToken - description
   *
   * @param  {type} token:string description
   * @return {type}              description
   */
  setToken(token: string) {
    this.token = token;
  }


  /**
   * getToken - description
   *
   * @param  {type} token:string description
   * @return {type}              description
   */
  getToken() {
    return this.token;
  }

  /**
   * get - description
   *
   * @param  {type} path:string description
   * @return {type}             description
   */
  get(path: string) {
    let options = { headers: this.headers };
    return this.http.get(`${this.baseURL}${path}`, options);
  }


  /**
   * post - description
   *
   * @param  {type} path:string description
   * @return {type}             description
   */
  post(path: string, data?: Object) {
    const new_header = this.headers.append("Content-Type","application/json");
    let options = { headers: new_header };
    return this.http.post(`${this.baseURL}${path}`, JSON.stringify(data), options);
  }


  /**
   * put - description
   *
   * @param  {type} path:string  description
   * @param  {type} data?:Object description
   * @return {type}              description
   */
  put(path: string, data?: Object) {
    let options = { headers: this.headers };
    return this.http.put(`${this.baseURL}${path}`, JSON.stringify(data), options);
  }

  /**
   * delete - description
   *
   * @param  {type} path:string description
   * @return {type}             description
   */
  delete(path: string) {
    let options = { headers: this.headers };
    return this.http.delete(`${this.baseURL}${path}`, options);
  }


  /**
   * postURLParams - description
   *
   * @param  {type} path: string   description
   * @param  {type} params: Object description
   * @return {type}                description
   */
  postURLParams(path: string, body: any) {
    const new_header = this.headers.append("Content-Type","application/x-www-form-urlencoded");
    let options = { headers: new_header };
    // let body = new HttpParams();
    // body.set('grant_type','password');
    // body.set('username',data.username);
    // body.set('password',data.password);
    // body.set('client_id',data.client_id);
    // body.set('client_secret',data.client_secret);
    return this.http.post(`${this.baseURL}${path}`,body.toString(), options);
  }

  postFileupload(path:string,formData){
    return new Promise((resolve, reject) => {
    let xhr:XMLHttpRequest = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                resolve(JSON.parse(xhr.response));
            } else {
                reject(xhr.response);
            }
        }
    };
    xhr.open('POST', `${this.baseURL}${path}`, true);
    xhr.setRequestHeader("Authorization", `Bearer ${this.token}`);
    xhr.send(formData);
});
  }

}
