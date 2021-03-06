import { Component } from '@angular/core';
import { IonicPage, NavController, LoadingController, Loading, AlertController, MenuController, ModalController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FirebaseProvider } from '../../providers/firebase/firebase';
import { EmailValidator } from '../../validators/email';
import { PasswordValidator } from '../../validators/password';
import { LoginPage } from '../login/login'
import { AutocompletePage } from '../autocomplete/autocomplete';

@IonicPage()
@Component({
  selector: 'page-signup-pro',
  templateUrl: 'signup-pro.html',
})
export class SignupProPage {
  public signupForm:FormGroup;
  public loading:Loading;
  public submitAttempt;

  constructor(public nav: NavController, public authData: FirebaseProvider, public formBuilder: FormBuilder, 
    public loadingCtrl: LoadingController, public alertCtrl: AlertController, public menu: MenuController, 
    public modalCtrl: ModalController) {

    // building signup form
    this.signupForm = formBuilder.group({
      firstName: ['', Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(64),
        Validators.pattern("^[a-zA-z]+$")])],
      lastName: ['', Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(64),
        Validators.pattern("^[a-zA-z]+$")])],
      email: ['', Validators.compose([Validators.required, EmailValidator.isValid])],
      password: ['', Validators.compose([Validators.required, PasswordValidator.isValid])],
      address: ['', Validators.compose([Validators.required])],
      dateOfBirth: ['', Validators.compose([Validators.required, Validators.pattern("[0-9]{2}/[0-9]{2}/[1-2][0-9]{3}")])],
      driverLicenceNumber: ['', Validators.compose([Validators.required, Validators.pattern("[0-9a-zA-Z]{15}")])],
      phoneNumber: ['', Validators.compose([Validators.required, Validators.pattern("[0-9]{10}"), Validators.maxLength(10)])]
    });
  }

  signupUser(){
    this.submitAttempt = true;

    // check if the form is valid
    if (!this.signupForm.valid){
      console.log(this.signupForm.value);
    } else {
      // signup the user as a pro
      this.authData.signupProUser(this.signupForm.value.email, this.signupForm.value.password, this.signupForm.value.firstName, 
        this.signupForm.value.lastName, this.signupForm.value.address, this.signupForm.value.dateOfBirth, 
        this.signupForm.value.driverLicenceNumber, this.signupForm.value.phoneNumber)
      .then(() => {
        let alert = this.alertCtrl.create({
          message: "An email has been sent to you to verify your email address",
          buttons: [
            {
              text: "Ok",
              role: 'cancel'
            }
          ]
        });
        alert.present();
        this.nav.setRoot(LoginPage);
      }, (error) => {
        this.loading.dismiss().then( () => {
          var errorMessage: string = error.message;
            let alert = this.alertCtrl.create({
              message: errorMessage,
              buttons: [
                {
                  text: "Ok",
                  role: 'cancel'
                }
              ]
            });
          alert.present();
        });
      });

      this.loading = this.loadingCtrl.create({
        dismissOnPageChange: true,
      });
      this.loading.present();
    }
  }

  // get autocomplete address string
  showAddressModal(){
    let modal = this.modalCtrl.create(AutocompletePage);
    modal.onDidDismiss(data => {
      this.signupForm.controls['address'].setValue(data === undefined ? null : data.description);
    });
    modal.present();
  }


  // redirect to homepage
  goHome(){
    this.nav.setRoot(LoginPage);
  }
}