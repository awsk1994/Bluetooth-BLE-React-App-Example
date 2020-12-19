import React, { Component } from 'react';
import { TextInput, Alert, StyleSheet, View, List, Text, Button, FlatList, ToastAndroid, ScrollView, TouchableOpacity } from 'react-native';

import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer/'

class App extends Component {
  constructor() {
    super();
    this.state = {
      status: null,
      scanning: false,
      devices: [],
      services: [],
      characteristics: [],
      characteristic: null,
      readValue: null,
      writeValue: null
    };
    const manager = this.bleManager = new BleManager();
  };

  componentWillUnmount() {
    console.log("ComponentUnMount");  // TODO: Getting error. Unable to detect when bleManager is undefined...
    if(this.bleManager != null || typeof this.bleManager != "undefined"){
      this.bleManager.destroy();
    }
  }

  scanDevices = async () => {
    console.log("Scanning Devices");
    this.setState({scanning: true});
    this.bleManager.startDeviceScan(null, {allowDuplicates: false}, this.onScannedDevice);
  };

  onScannedDevice = (error, device) => {
    // console.log("onScannedDevice");
    if (error) {
      console.log("ERROR:");
      console.log(error);
      ToastAndroid.show("ERROR: " + error, ToastAndroid.SHORT);
      return
    }
    
    if (this.state.devices.findIndex(item => item.id === device.id) < 0) {
      this.setState({
        devices: [...this.state.devices, device]
      })
    };
  };

  stopScan = () => {
    this.bleManager.stopDeviceScan()
    this.setState({ scanning: false })
  };

  debugState = () => {
    console.log(this.state);
  }

  reset = () => {
    this.setState({
      devices: [],
      services: [],
      characteristics: [],
      characteristic: null,
      readValue: null,
      writeValue: null
    });
  }

  connectDevice = async (device) => {
    try{
      this.stopScan() // Stop Scanning
      ToastAndroid.show("Connecting to Device...", ToastAndroid.SHORT);
      console.group("Connecting to Device.");
      await device.connect();
      console.log('Connected to Device：', device.id)
      let serviceAndChar = await device.discoverAllServicesAndCharacteristics();
      console.log('Getting services and characteristics...');
      console.log(serviceAndChar);
  
      Alert.alert('Connected to Device', null, [
        { text: 'Cancel' },
        { text: "Enter", onPress: () => this.onPressDevice(device)}
      ]);
    } catch(err){
      console.log("ERROR");
      console.log(err);
      ToastAndroid.show("ERROR: " + err, ToastAndroid.SHORT);
    }
  };

  onPressDevice = async (device) => {
    let services = await device.services();
    this.setState({services});
  };

  onPressService = async(service) => {
    let characteristics = await service.characteristics()
    this.setState({characteristics});
  };

  onPressCharacteristic = async(characteristic) => {
    console.log("onPressCharacteristic")
    this.setState({characteristic});
  }

  onPressReadOp = async() => {
    console.log("onPressReadOp");
    try{
      let char = await this.state.characteristic.read();
      console.log("Characteristics Read Value: " + char.value);
      ToastAndroid.show("Characteristics Read Value: " + char.value, ToastAndroid.SHORT);
      this.setState({readValue: char.value});
    } catch(err){
      console.log("ERROR:");
      console.log(err);
      ToastAndroid.show("ERROR: " + err, ToastAndroid.SHORT);
    }
  };

  onPressWriteOp = () => {
    console.log("onPressWriteOp");
    const writeValue = this.state.writeValue;

    if (!writeValue) {
      Alert.alert('请输入要写入的特征值')
    }

    console.log('开始写入特征值：', writeValue)
    ToastAndroid.show('开始写入特征值：' + writeValue, ToastAndroid.SHORT);

    this.state.characteristic.writeWithResponse(writeValue)
      .then(() => {
        Alert.alert('成功写入特征值', '现在点击读取特征值看看吧...')
      })
      .catch(err => {
        console.log('写入特征值出错：', err)
        ToastAndroid.show("ERROR: " + err, ToastAndroid.SHORT);
      })
  };

  render() {
    return (
      <View>
        <ScrollView>
          <Text>BLE</Text>
          <Text>Scanning: {this.state.scanning.toString()}</Text>
          <Button title="Scan Devices" onPress={this.scanDevices}/>
          <Button title="Stop Scan" onPress={this.stopScan}/>
          <Button title="Debug State" onPress={this.debugState}/>
          <Button title="Reset" onPress={this.reset}/>
          <Text style={styles.h1}>DEVICES:</Text>
          {this.state.scanning && <View>
            <FlatList 
              keyExtractor={(item, index) => index.toString()}
              data={this.state.devices}
              renderItem={itemData => (
              <TouchableOpacity onPress = {() => {this.connectDevice(itemData.item)}}>
                <View style={styles.card}>
                  <Text>{itemData.item.id}</Text>
                  <Text>({itemData.item.name || itemData.item.localName})</Text>
                  <Text>(serviceUUIDs = {itemData.item.serviceUUIDs})</Text>
                  {/* <Text>(isConnectable = {itemData.item.isConnectable ? })</Text> */}
                </View>
              </TouchableOpacity>
              )}
            />
          </View>
          }
          <Text style={styles.h1}>SERVICES:</Text>
          {this.state.services && <View>
            <FlatList 
              keyExtractor={(item, index) => index.toString()}
              data={this.state.services}
              renderItem={itemData => (
              <TouchableOpacity onPress = {() => {this.onPressService(itemData.item)}}>
                <View style={styles.card}>
                  <Text>{`UUID: ${itemData.item.uuid}`}</Text>
                </View>
              </TouchableOpacity>
              )}
            />
          </View>
          }
          <Text style={styles.h1}>CHARACTERISTICS:</Text>
          {this.state.characteristics && <View>
            <FlatList 
              keyExtractor={(item, index) => index.toString()}
              data={this.state.characteristics}
              renderItem={itemData => (
              <TouchableOpacity onPress = {() => {this.onPressCharacteristic(itemData.item)}}>
                <View style={styles.card}>
                  <Text>{`UUID: ${itemData.item.uuid}`}</Text>
                  <Text>{`isReadable: ${itemData.item.isReadable}`}</Text>
                  <Text>{`isWritableWithResponse: ${itemData.item.isWritableWithResponse}`}</Text>
                  <Text>{`isWritableWithoutResponse: ${itemData.item.isWritableWithoutResponse}`}</Text>
                </View>
              </TouchableOpacity>
              )}
            />
          </View>
          }
          <Text style={styles.h1}>OPERATIONS:</Text>
          {this.state.characteristic && <View>
            <Text>Read value is: {this.state.readValue }.</Text>
            <Button type="primary" style={{ marginTop: 8 }} onPress={this.onPressReadOp} title="读取特征值"/>
            <TextInput
                style={styles.input}
                placeholder="请输入特征值"
                value={this.state.writeValue}
                onChangeText={v => this.setState({ writeValue: v })}
              />
            <Button type="primary" onPress={this.onPressWriteOp} title="写入特征值"/>
          </View>
          }
        </ScrollView>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  card: {
    marginTop: 5,
    marginBottom: 5,
    borderColor: 'black',
    borderWidth: 1
  },
  input: {
    height: 40
  },
  h1: {
    fontSize: 20,
    fontWeight: "bold"
  }
});

export default App;
