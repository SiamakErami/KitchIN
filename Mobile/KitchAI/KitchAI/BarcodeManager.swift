//
//  BarcodeManager.swift
//  KitchAI
//
//  Created by mustafa masody on 10/8/23.
//

import Foundation
import AVFoundation
import SwiftUI
import Alamofire

class BarcodeModel: NSObject, ObservableObject, AVCaptureMetadataOutputObjectsDelegate {
    
    // Public Published Variables
    @Published var session = AVCaptureSession()
    @Published var output = AVCapturePhotoOutput()
    @Published var preview: AVCaptureVideoPreviewLayer!
    @Published var barcodePosition: CGRect! = CGRect.zero
    @Published var barcodeValue: String! = ""
    @Published var sku: String! = ""
    @Published var isLoading: Bool = false
    
    // Private Variables
    private let sessionQueue = DispatchQueue(label: "barcode-manager")
    private var captureMetadataOutput = AVCaptureMetadataOutput()
    private var position: AVCaptureDevice.Position = .back
    private var camera: AVCaptureDevice.DeviceType = .builtInWideAngleCamera
    private var flash: AVCaptureDevice.FlashMode = .off
    private var currentDeviceInput: AVCaptureDeviceInput!
    
    // Check App Camera Permissions
    func checkPermission(position: AVCaptureDevice.Position? = nil) {
        
        switch AVCaptureDevice.authorizationStatus(for: .video) {
            
            case .authorized:
                sessionQueue.async {
                    self.startSession(position: position)
                }
                return
            case .notDetermined:
                sessionQueue.async {
                    self.askPermission(position: position)
                }
                return
            case .denied, .restricted:
                print("Turn on in settings")
                // Ask anyway for demo purposes
                sessionQueue.async {
                    self.askPermission(position: position)
                }
                return
            default:
                print("Error validifying video authorization status")
                return
            
        }
        
    }
    
    // Ask for Permission
    func askPermission(position: AVCaptureDevice.Position? = nil) {
        
        AVCaptureDevice.requestAccess(for: .video) { allow in
            
            if (allow) {
                
                self.sessionQueue.async {
                    self.startSession(position: position)
                }
                
            } else {
                
                print("User did not allow access for video: \(allow)")
                // Basic recursion
                self.sessionQueue.async {
                    self.askPermission(position: position)
                }
                
            }
            
        }
        
    }
    
    // Configure Camera Session
    func startSession(position: AVCaptureDevice.Position? = nil) {
        
        sessionQueue.async {
            
            do {
                
                self.session.beginConfiguration()
                
                self.position =  position != nil ? position! : self.position
                
                let device = AVCaptureDevice.default(self.camera, for: .video, position: self.position)
                
                let input = try AVCaptureDeviceInput(device: device!)
                
                self.currentDeviceInput = input
                
                if (self.session.canAddInput(input)) {
                    
                    self.session.addInput(input)
                    
                }
                
                if (self.session.canAddOutput(self.output)) {
                    
                    self.session.addOutput(self.output)
                    
                }
                
                if (self.session.canAddOutput(self.captureMetadataOutput) && self.position == .back) {
                    
                    self.session.addOutput(self.captureMetadataOutput)
                    self.captureMetadataOutput.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
                    self.captureMetadataOutput.metadataObjectTypes = [AVMetadataObject.ObjectType.upce, AVMetadataObject.ObjectType.gs1DataBar, AVMetadataObject.ObjectType.gs1DataBarLimited, AVMetadataObject.ObjectType.gs1DataBarExpanded, AVMetadataObject.ObjectType.ean8, AVMetadataObject.ObjectType.ean13]
                    
                }
                
                self.session.sessionPreset = .high
                
                self.session.commitConfiguration()
                
            } catch {
                
                print(error.localizedDescription)
                
            }
            
        }
        
    }
    
    func currentCamera() -> AVCaptureDevice.DeviceType {
        
        return self.camera
        
    }
    
    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        
        // Check if the metadataObjects array is not nil and it contains at least one object.
        if metadataObjects.count == 0 {
            self.barcodePosition = CGRect.zero
            self.barcodeValue = "No Barcode Found..."
            return
        }

        // Get the metadata object.
        let metadataObj = metadataObjects[0] as! AVMetadataMachineReadableCodeObject

        if metadataObj.type == AVMetadataObject.ObjectType.upce || metadataObj.type == AVMetadataObject.ObjectType.gs1DataBar || metadataObj.type == AVMetadataObject.ObjectType.gs1DataBarLimited || metadataObj.type == AVMetadataObject.ObjectType.gs1DataBarExpanded || metadataObj.type == AVMetadataObject.ObjectType.ean8 || metadataObj.type == AVMetadataObject.ObjectType.ean13 {
            
            // If the found metadata is equal to the barcode metadata then update the status label's text and set the bounds
            let barCodeObject = preview?.transformedMetadataObject(for: metadataObj)
            self.barcodePosition = barCodeObject!.bounds
            self.barcodeValue = metadataObj.stringValue
            
            if (self.barcodeValue != self.sku) {
                
                self.sku = self.barcodeValue
                print("Barcode Value: \(self.sku)")
                
                // TODO: Handle this
                
            }
            
        }
        
    }
    
}

struct BarcodePreview: UIViewRepresentable {
    
    @ObservedObject var camera: BarcodeModel
    
    func makeUIView(context: Context) -> UIView {
        
        let view = UIView(frame: UIScreen.main.bounds)
        
        DispatchQueue.main.async {
            
            camera.preview = AVCaptureVideoPreviewLayer(session: camera.session)
            camera.preview.frame = view.frame
            camera.preview.videoGravity = .resizeAspectFill
            camera.preview.connection?.videoOrientation = .portrait
            camera.preview.connection?.automaticallyAdjustsVideoMirroring = true
            view.layer.addSublayer(camera.preview!)
            
        }
        
        DispatchQueue.global(qos: .background).async {
            camera.session.startRunning()
        }
        
        return view
        
    }
    
    func updateUIView(_ uiView: UIView, context: Context) {
    
        // NO IMPLEMENTATION NEEDED
        
    }
    
}

struct BarcodeCodable: Codable {
    
    let code: String?
    let product: ProductCodable?
    
    private enum CodingKeys: String, CodingKey {

        case code
        case product

    }
    
    struct ProductCodable: Codable {
        
        let productName: String?
        let image: String?
        let brand: String?
        
        private enum CodingKeys: String, CodingKey {

            case productName = "product_name"
            case image = "image_url"
            case brand = "brands"

        }
        
    }
    
}

struct BarcodeScannerView: View {
    
    @StateObject var camera = BarcodeModel()
    @State private var captureSession: AVCaptureSession?
    @State private var videoPreviewLayer: AVCaptureVideoPreviewLayer?
    @State private var isLoading = false
    @State private var barcodeDecodable: BarcodeCodable?
    
    @Environment(\.dismiss) var dismiss
    @Binding var presented: Bool
    @Binding var ingredients: [String]
    
    var body: some View {
        
        GeometryReader() { bounds in
            
            ZStack {
                
                BarcodePreview(camera: camera)
                    .background(.black)
                    .ignoresSafeArea(.all)
                
                VStack {
                    
                    Spacer()
                    
                    // Product Info
                    VStack {
                        
                        // Product Image
                        AsyncImage(url: URL(string: barcodeDecodable?.product?.image ?? "https://arnulfomexicanfood.com/img/placeholders/grey_fork_and_knife.png")) { image in
                            
                            image.resizable().scaledToFill()
                            
                        } placeholder: {
                            
                            ProgressView()
                                .progressViewStyle(.circular)
                            
                        }.frame(width: 200, height: 200)
                            .background(.ultraThinMaterial)
                            .cornerRadius(10)
                        
                        // Product Name
                        Text(isLoading ? "Loading Product..." : barcodeDecodable?.product?.productName ?? "")
                            .font(.custom("CreteRound-Regular", size: 17))
                            .multilineTextAlignment(.center)
                        
                        // Product Brand(s)
                        Text(isLoading ? "Loading Brand..." : barcodeDecodable?.product?.brand ?? "")
                            .font(.custom("CreteRound-Italic", size: 13))
                        
                        // Add Item to Request
                        Button {
                            
                            ingredients.append((barcodeDecodable?.product?.productName)!)
                            print("ADDED: \(ingredients)")
                            // Dismiss currently displayed
                            self.camera.sku = ""
                            
                        } label: {
                            
                            Text("Add to Request")
                                .font(.custom("CreteRound-Regular", size: 15))
                                .foregroundStyle(Color("Background"))
                                .padding(.vertical, 10)
                                .frame(width: 200)
                                .background(Color("Primary"))
                                .cornerRadius(10)
                            
                        }
                        
                    }.padding(20)
                        .frame(maxWidth: 240)
                        .background(.ultraThinMaterial)
                        .cornerRadius(10)
                        .opacity((isLoading || (barcodeDecodable != nil)) ? 1 : 0)
                        .animation(.bouncy, value: isLoading || ((barcodeDecodable?.code) != nil))
                    
                    Spacer()
                    
                    // Dismiss
                    HStack {
                        
                        Spacer()
                        
                        Button {
                            
                            if (isLoading || barcodeDecodable != nil) {
                                
                                // Dismiss currently displayed
                                self.camera.sku = ""
                                
                            } else {
                                
                                // Dismiss view
                                dismiss()
                                self.presented = false
                                
                            }
                            
                        } label: {
                            
                            Image(systemName: isLoading || barcodeDecodable != nil ? "xmark" : "chevron.down")
                                .resizable()
                                .scaledToFit()
                                .fontWeight(.semibold)
                                .foregroundStyle(Color("Primary"))
                                .padding(12)
                                .frame(width: 40, height: 40)
                                .background(.ultraThinMaterial)
                                .cornerRadius(10)
                                .animation(.easeInOut(duration: 0.5), value: isLoading || ((barcodeDecodable?.code) != nil))
                            
                        }
                        
                        Spacer()
                        
                    }.padding(.bottom, 8)
                    
                }
                
            }.onAppear {
                
                // Start up camera
                self.camera.checkPermission()
                
            }.onChange(of: camera.sku) {
                
                if (camera.sku != "") {
                    
                    self.isLoading = true
                    self.getFoodInfo(barcode: self.camera.sku)
                    
                } else {
                    
                    self.isLoading = false
                    self.barcodeDecodable = nil
                    
                }
                
            }
            
        }
        
    }

    // Private Functions
    func getFoodInfo(barcode: String) {
        
        AF.request("https://world.openfoodfacts.net/api/v2/product/\(barcode)", method: .get, headers: [HTTPHeader(name: "UserAgent", value: "KitchIN/1.0.0")]).responseDecodable(of: BarcodeCodable.self) { response in
            
            // Decode response
            if response.value != nil {
                
                // Set barcodeDecodable
                let barcodeInfo = response.value!
                self.barcodeDecodable = barcodeInfo
                print("DECODED ITEM: \(barcodeDecodable)")
                self.isLoading = false
                
            } else {
                
                // TODO: Handle This Error
                print("Error Decoding Barcode Info")
                
            }
            
        }
        
    }
    
}

#Preview {
    BarcodeScannerView(presented: .constant(true), ingredients: .constant(["pizza sauce"]))
}
