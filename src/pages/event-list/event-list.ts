import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { HttpClient } from '@angular/common/http';
import 'rxjs/add/operator/map';
import { AngularFirestoreCollection, AngularFirestore } from 'angularfire2/firestore';
import { FirebaseProvider } from '../../providers/firebase/firebase';
import { LoadingController } from 'ionic-angular/components/loading/loading-controller';
import { UserEvent } from '../../models/events/userevent.model';

interface Event{
  id: string;
  name: string;
}

interface Member{
  id: string;
  name: string;
}

@Component({
  selector: 'page-event-list',
  templateUrl: 'event-list.html'
})

export class EventListPage {
  api: string = 'http://app.toronto.ca/cc_sr_v1_app/data/edc_eventcal_APR?limit=500';
  eventData: any;
  userEventData: any;
  imgLink: string = "https://secure.toronto.ca";
  eventCollection: AngularFirestoreCollection<Event>;
  events: any;
  userEventCollection: AngularFirestoreCollection<Member>;
  userEvents: any;
  userID: string;
  eventArr: string[] = [];
  time: number;

  constructor(public navCtrl: NavController, private http: HttpClient, 
    private firebase: FirebaseProvider, private afs: AngularFirestore,
    public loading: LoadingController) {
    this.userID = this.firebase.getUserId();

    this.eventCollection = this.afs.collection<Event>('bookmarkedEvents', ref => {
      return ref.orderBy('name')
    });
    
    this.events = this.eventCollection.snapshotChanges().map(actions => {
      return actions.map(snap => {
        let id = snap.payload.doc.id;
        let data = { id, ...snap.payload.doc.data() };
        return data;
      });
    });
    
    this.userEventCollection = this.afs.collection('users').doc(this.userID).collection<Member>('bookmarkedEvents');
    this.userEvents = this.userEventCollection.snapshotChanges().forEach(a => {
      this.eventArr = [];
      for ( var i in a )
        this.eventArr.push(a[i].payload.doc.id);
    });

    this.userEventData = this.afs.collection<UserEvent>("events").snapshotChanges()
    .map(actions => {
      return actions.map(snap => {
        let id = snap.payload.doc.id;
        let data = { id, ...snap.payload.doc.data() };
        return data;
      })
    });
  }

  ionViewDidLoad(){

    let loader = this.loading.create({
      content: "loading...."
    });  
    loader.present();
    
    this.http.get(this.api)
    .subscribe(data => {
      this.eventData = data;
    }, err => {
      console.log(err);
    }, () => {
      loader.dismiss();
    }); 
  }

  icon(id){
    var checker = false;
    this.eventArr.forEach(i => {
      if ( i == id )
        checker = true;
    })
    if (checker)
      return 'star';
    return 'bookmark';
  }

  addEvent(item){
    console.log(item);
    if( this.icon(item.recId) == 'bookmark' ){

      let id = item.recId;
      let lat = item.locations[0]["coords"].lat === undefined ? (item.locations[0]["coords"][0].lat === undefined ? "" : item.locations[0]["coords"][0].lat) : item.locations[0]["coords"].lat;
      let lng = item.locations[0]["coords"].lng === undefined ? (item.locations[0]["coords"][0].lng === undefined ? "" : item.locations[0]["coords"][0].lng) : item.locations[0]["coords"].lng;
      let startDate = item["startDate"].substr(0,10);
      let startTime = item["startDateTime"] === undefined || item["startDateTime"] === null ? "" : item["startDateTime"].substr(11,5);
      let endDate = item["endDate"].substr(0,10);
      let endTime = item["endDateTime"]  === undefined || item["endDateTime"] === null ? "" : item["endDateTime"].substr(11,5);
      let name = item.eventName;
      let webSite = item.eventWebsite;
      let description = item.description;
      let orgPhone = item.orgPhone;
      let orgAddress = item.orgAddress;
      let categories = item.categoryString;
      let price = item["otherCostInfo"] === undefined || item["otherCostInfo"] === null ? "" : item["otherCostInfo"];
      
      this.firebase.bookmarkEvent(lat, lng, startDate, startTime, endDate, endTime, name,
        price, webSite, description, orgPhone, orgAddress, categories, id);
      this.eventArr.push(item.recId);

      //this.firebase.scheduleNotification(item.recId, startDate, startTime, this.time);
    } else {

      this.firebase.unbookmarkEvent(item.recId);
      this.eventArr.splice(item.recId);

      //this.firebase.cancelNotification(item.recId);
    }
  }

  addUserEvent(item){
    if( this.icon(item.id) == 'bookmark' ){

      this.firebase.bookmarkUserEvent(item, item.id);
      this.eventArr.push(item.id);

     //this.firebase.scheduleNotification(item.id, item.startDate, item.startTime, this.time);

    } else {

      this.firebase.unbookmarkEvent(item.id);
      this.eventArr.splice(item.id);

      //this.firebase.cancelNotification(item.id);
    }
  }

}