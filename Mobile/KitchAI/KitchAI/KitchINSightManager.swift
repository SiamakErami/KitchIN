//
//  KitchINSightView.swift
//  KitchAI
//
//  Created by mustafa masody on 10/8/23.
//

import Foundation
import AVFoundation
import SwiftUI
import Alamofire

class KitchINSightModel: NSObject, ObservableObject, AVCapturePhotoCaptureDelegate {
    
    // Public Published Variables
    @Published var session = AVCaptureSession()
    @Published var output = AVCapturePhotoOutput()
    @Published var preview: AVCaptureVideoPreviewLayer!
    @Published var isLoading: Bool = false
    @Published var ingredients: [String] = []
    
    // Private Variables
    private let sessionQueue = DispatchQueue(label: "kitchinsight-manager")
    private var position: AVCaptureDevice.Position = .back
    private var camera: AVCaptureDevice.DeviceType = .builtInWideAngleCamera
    private var flash: AVCaptureDevice.FlashMode = .off
    private var currentDeviceInput: AVCaptureDeviceInput!
    private var photoData: Data?
    
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
    
    func takePicture() {
        
        self.isLoading = true
        
        if (self.session.isRunning) {
            
            print("Taking Picture")
            
            sessionQueue.async {
                self.output.capturePhoto(with: AVCapturePhotoSettings(), delegate: self)
            }
            
        }
        
    }
        
    func photoOutput(_ output: AVCapturePhotoOutput, willCapturePhotoFor resolvedSettings: AVCaptureResolvedPhotoSettings) {
        
        print("Taking Picture 2")
        
        // Flash the screen to signal that the camera took a photo.
        self.preview.opacity = 0
        UIView.animate(withDuration: 0.25) {
            self.preview.opacity = 1
        }
        
    }
    
    func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        
        print("Taking Picture 3")
        
        if let error = error {
            
            print("Error capturing photo: \(error)")
            
        } else {
            
            print("Taking Picture 4")
            
            var image = UIImage(data: photo.fileDataRepresentation()!)
            
            // TODO: Handle image processed
            self.photoData = image?.jpegData(compressionQuality: 0.9)
            self.processImage()
            
        }
        
    }
    
    func processImage() {
        
        print("Taking Picture 5")
        
        AF.upload(multipartFormData: { multiformdata in
            
            // TODO: Append Data
            print("PHOTO DATA: \(self.photoData)")
            multiformdata.append(self.photoData!, withName: "photoData", mimeType: "image/png")
            
        }, to: "https://KitchIN-2023.uc.r.appspot.com/api/ml", method: .post).responseData() { response in
            
            print("REPSONSE: \(String(data: response.data!, encoding: .utf8))")
            
        }.responseDecodable(of: MLCodable.self) { response in
            
            self.isLoading = false
            
            // Decode response
            if response.value != nil {
                
                let userInfo = response.value!
                
                if (200 <= response.response!.statusCode && response.response!.statusCode < 300) {
                    
                    // Print
                    print("USER INFO: \(userInfo)")
                    self.ingredients = userInfo.classNames!
                    
                }
                
            } else {
                
                print("ERROR ERROR ERROR")
                
            }
                    
        }
        
    }
    
}

struct MLCodable: Codable {
    
    let classNames: [String]?
    
    private enum CodingKeys: String, CodingKey {

        case classNames = "class_names"

    }
    
}

struct KitchINSightPreview: UIViewRepresentable {
    
    @ObservedObject var camera: KitchINSightModel
    
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

struct KitchINSightView: View {
    
    @StateObject var camera = KitchINSightModel()
    @State private var captureSession: AVCaptureSession?
    @State private var videoPreviewLayer: AVCaptureVideoPreviewLayer?
    @State private var isLoading = false
    
    @Environment(\.dismiss) var dismiss
    @Binding var presented: Bool
    @Binding var ingredients: [String]
    
    var body: some View {
        
        GeometryReader() { bounds in
            
            ZStack {
                
                KitchINSightPreview(camera: camera)
                    .background(.black)
                    .ignoresSafeArea(.all)
                
                VStack {
                    
                    Spacer()
                    
                    ProgressView()
                        .progressViewStyle(.circular)
                        .padding()
                        .background(.ultraThinMaterial)
                        .cornerRadius(10)
                        .opacity(isLoading ? 1 : 0)
                    
                    Spacer()
                    
                    VStack {
                        
                        // Capture
                        HStack {
                            
                            Spacer()
                            
                            Button {
                                
                                // TODO: Take Picture
                                print("Take Picture")
                                self.isLoading = true
                                self.camera.takePicture()
                                
                            } label: {
                                
                                Image(systemName: "circle")
                                    .resizable()
                                    .scaledToFit()
                                    .fontWeight(.semibold)
                                    .foregroundStyle(.white)
                                    .frame(width: 80, height: 80)
                                
                            }
                            
                            Spacer()
                            
                        }.padding(.bottom, 8)
                        
                        // Dismiss
                        HStack {
                            
                            Spacer()
                            
                            Button {
                                
                                // Dismiss view
                                dismiss()
                                self.presented = false
                                
                            } label: {
                                
                                Image(systemName: "chevron.down")
                                    .resizable()
                                    .scaledToFit()
                                    .fontWeight(.semibold)
                                    .foregroundStyle(Color("Primary"))
                                    .padding(12)
                                    .frame(width: 40, height: 40)
                                    .background(.ultraThinMaterial)
                                    .cornerRadius(10)
                                
                            }
                            
                            Spacer()
                            
                        }
                        
                    }.padding(.bottom, 8)
                    
                }
                
            }.onAppear {
                
                // Start up camera
                self.camera.checkPermission()
                
            }.onChange(of: camera.ingredients) {
                
                self.isLoading = false
                self.ingredients = camera.ingredients
                
            }
            
        }
        
    }
    
}

#Preview {
    KitchINSightView(presented: .constant(true), ingredients: .constant(["pizza sauce"]))
}
