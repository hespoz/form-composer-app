import React, { Component }  from 'react';
import { View, Text, StyleSheet,TextInput,Picker,Switch, Button, Alert } from 'react-native';

import { Actions } from 'react-native-router-flux';
import NavigationBar from 'react-native-navbar';
import InputControl from './controls/InputControl.js';
import CheckBoxControl from './controls/CheckBoxControl.js';
import DatePickerControl from './controls/DatePickerControl.js';
import DropDownControl from './controls/DropDownControl.js';
import SignatureControl from './controls/SignatureControl.js';
import SQLite from 'react-native-sqlite-storage';
import DBHelper from './helpers/DBHelper.js';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  }
});

const leftButtonConfig = {
  title: 'Back',
  handler: () => Actions.pop()
};



class FormView extends Component {

  constructor(props){
    super(props);
    console.log("breakpoint")
    this.state = {
      form:props.form,
        formIdSaved: props.formId == undefined || props.formId == null ? null : props.formId
    };

    DBHelper.openDatabase();

  }

  componentWillMount = () => {
      this.setState({});
  }

  updateFormState = (newForm) => {
    this.setState({form:newForm});
  }


  saveForm = () => {
    let formToSave = this.state.form;
    DBHelper.db.transaction((tx) => {

        //Check if the form exists, and if so get the number of parameters.
        DBHelper.getFormByName(tx, this.props.form.form, (tx, results) => {
            if (results.rows.length >= 1) {
                if(this.state.formIdSaved == null){

                    var id = results.rows.item(0).id;
                    var instances = results.rows.item(0).numberInstances;
                    instances++;

                    DBHelper.insertFormEntry(tx, JSON.stringify(formToSave) ,id, (tx,res) => {

                        DBHelper.updateFormNumberInstances(tx, instances, id , (tx, res) => {
                            this.setState({formIdSaved:res.insertId});
                        });


                    });

                } else {
                    //Update formentry.
                    DBHelper.updateFormEntry(tx, JSON.stringify(formToSave) , this.state.formIdSaved, function(tx,res) {
                        console.log("Update formentry");
                    });
                }
            } else {
                DBHelper.insertForm(tx, this.props.form.form, (tx,res) => {
                    DBHelper.insertFormEntry(tx,JSON.stringify(formToSave),res.insertId, (tx, res) => {
                        this.setState({formIdSaved:res.insertId});
                    });
                });
            }


        });


    });
  }

  saveFormAndSend = () => {
      console.log("this.state", this.state);

      fetch("http://localhost:3000/templates/pdf",
          {
              headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
              },
              method: "POST",
              body: JSON.stringify(this.state.form)
          }).then((response) => {
          return response.json()
      }).then((responseData) => {
          console.log("responseData", responseData);
          Alert.alert('saveForm');
      }).done();


  }

  errorCB = () => {
      console.log("SQL executed fine");
  }

  openCB = () => {
      console.log("Database OPENED");
  }

  render(){
    return (
      <View style={styles.container}>
          <NavigationBar
                  title={ {
                    title: this.props.form.form
                  }}
                  leftButton={leftButtonConfig}
          />


          {this.state.form.fields.map((field,index) => {

            switch(field.type){
              case 'text': case 'password':
                  return (<InputControl key={index} index={index} form={this.state.form} updateFormState={this.updateFormState}/>);
                break;
              case 'checkbox':
                  return (<CheckBoxControl key={index} index={index} form={this.state.form} updateFormState={this.updateFormState}/>)
                  break;
              case 'date':
                return(<DatePickerControl key={index} index={index} form={this.state.form} updateFormState={this.updateFormState}/>);
                  break;
              case 'select':
                return (<DropDownControl key={index} index={index} form={this.state.form} updateFormState={this.updateFormState}/>);
                  break;
                case 'signature':
                  return (<SignatureControl key={index} index={index} form={this.state.form} updateFormState={this.updateFormState}/>);
                  break;
              default:
               return null;
            }


          })}

        <Button
            onPress={this.saveForm}
            title="Save form locally"
            color="#841584"
            accessibilityLabel="Learn more about this purple button"
        />

        <Button
            onPress={this.saveFormAndSend}
            title="Save as PDF"
            color="#841584"
            accessibilityLabel="Learn more about this purple button"
        />

      </View>
    )
  }

}

module.exports = FormView;
