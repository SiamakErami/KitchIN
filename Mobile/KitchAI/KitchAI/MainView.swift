//
//  MainView.swift
//  KitchAI
//
//  Created by mustafa masody on 10/8/23.
//

import SwiftUI
import Alamofire

struct MainView: View {
    
    // Chat variables
    @State private var isLoading = false
    @State private var messages: [Message] = [Message(id: 0, who: "KitchAI", content: "Hello! I am KitchAI, your personal Kitchen assistant! Try asking me about how to cook a recipe, or maybe healthy alternatives to your favorite foods!", ingredients: ["Pizza Sauce", "Pepporoni"])]
    @State private var question: String = ""
    @State private var ingredients: [String] = []
    
    // Segue variables
    @State private var showBarcode = false
    @State private var showKitchINSight = false
    
    var body: some View {
        
        NavigationStack {
            
            GeometryReader { bounds in
                
                ZStack {
                    
                    VStack {
                        
                        List {
                            
                            // Top Spacing
                            Rectangle()
                                .frame(height: 60)
                                .foregroundColor(.clear)
                                .listRowSeparator(.hidden)
                                .listRowBackground(Color.clear)
                                .listRowInsets(EdgeInsets())
                            
                            ForEach(messages) { message in
                                
                                VStack {
                                    
                                    // Sender
                                    HStack {
                                        
                                        if (message.who != "KitchAI") {
                                            Spacer()
                                        }
                                        
                                        if (message.who == "KitchAI") {
                                            
                                            Image("KitchAI")
                                                .resizable()
                                                .scaledToFit()
                                                .frame(width: 30, height: 30)
                                                .cornerRadius(15)
                                            
                                        }
                                        
                                        Text(message.who)
                                            .font(.custom("CreteRound-Italic", size: 15))
                                            .foregroundStyle(Color("Primary"))
                                        
                                        if (message.who == "KitchAI") {
                                            Spacer()
                                        }
                                        
                                    }
                                    
                                    // Content
                                    Text(message.content)
                                        .font(.custom("CreteRound-Regular", size: 20))
                                        .multilineTextAlignment(message.who == "KitchAI" ? .leading : .trailing)
                                        .frame(maxWidth: .infinity, alignment: message.who == "KitchAI" ? .leading : .trailing)
                                    
                                }
                                
                            }.listRowSeparator(.hidden)
                                .listRowBackground(Color.clear)
                            
                            // Bottom Spacing
                            Rectangle()
                                .frame(height: 100)
                                .foregroundColor(.clear)
                                .listRowSeparator(.hidden)
                                .listRowBackground(Color.clear)
                            
                        }.listStyle(.plain)
                            .listRowSeparator(.hidden)
                            .scrollIndicators(.hidden)
                            .animation(.bouncy, value: messages.count)
                        
                    }.frame(width: bounds.size.width, height: bounds.size.height, alignment: .center)
                    
                    VStack(spacing: 0.0) {
                        
                        Rectangle()
                            .foregroundColor(Color("Background").opacity(0.85))
                            .frame(height: bounds.safeAreaInsets.top + 60)
                            .shadow(color: .gray.opacity(0.25), radius: 10, y: 10)
                        
                        Spacer()
                        
                    }.edgesIgnoringSafeArea(.top)
                        .background(.clear)
                    
                    VStack {
                        
                        HStack(spacing: 8) {
                            
                            Text("Chat")
                                .font(Font.custom("CreteRound-Regular", size: 20))
                                .foregroundColor(.primary)
                                .frame(height: 60)
                            
                            Spacer()
                            
                            Button {
                                
                                self.showBarcode = true
                                
                            } label: {
                                
                                Image(systemName: "barcode.viewfinder")
                                    .resizable()
                                    .scaledToFit()
                                    .foregroundStyle(Color("Primary"))
                                    .padding(12)
                                    .frame(width: 40, height: 40)
                                    .background(.ultraThinMaterial)
                                    .cornerRadius(10)
                                
                            }
                            
                            Button {
                                
                                self.showKitchINSight = true
                                
                            } label: {
                                
                                Image(systemName: "camera")
                                    .resizable()
                                    .scaledToFit()
                                    .foregroundStyle(Color("Primary"))
                                    .padding(12)
                                    .frame(width: 40, height: 40)
                                    .background(.ultraThinMaterial)
                                    .cornerRadius(10)
                                
                            }
                            
                        }.padding(.horizontal, 20)
                     
                        Spacer()
                        
                        // # of Ingredients
                        Button {
                            
                            // TODO: Show ingredients you currently have
                            ingredients = []
                            
                        } label: {
                            
                            HStack {
                                
                                Text("Using \(ingredients.count) ingredients...")
                                    .font(.custom("CreteRound-Italic", size: 15))
                                    .padding(10)
                                    .background(.ultraThinMaterial)
                                    .cornerRadius(10)
                                    .shadow(radius: 4, y: 4)
                                
                                Spacer()
                                
                            }
                                
                        }.buttonStyle(.plain)
                            .padding(.bottom, 8)
                            .padding(.horizontal, 20)
                        
                        // Prompt Input
                        HStack(spacing: 20) {
                            
                            TextField(isLoading ? "Loading..." : "Ask a question here...", text: $question)
                                .font(.custom("CreteRound-Regular", size: 15))
                                .foregroundStyle(Color("Primary"))
                                .padding(.horizontal, 20)
                                .frame(width: bounds.size.width - 100, height: 50)
                                .background(.ultraThinMaterial)
                                .cornerRadius(10)
                                .allowsHitTesting(!isLoading)
                                .shadow(radius: 4, y: 4)
                            
                            ZStack {
                                
                                // Loading Animation
                                ProgressView()
                                    .padding(15)
                                    .frame(width: 50, height: 50)
                                    .background(.ultraThinMaterial)
                                    .cornerRadius(10)
                                    .opacity(isLoading ? 1 : 0)
                                    .shadow(radius: 4, y: 4)
                                
                                // Submit Button
                                Button {
                                    
                                    if (!question.isEmpty) {
                                        self.sendMessage()
                                    }
                                    
                                } label: {
                                    
                                    Image(systemName: "paperplane")
                                        .resizable()
                                        .scaledToFit()
                                        .foregroundStyle(Color("Primary"))
                                        .padding(15)
                                        .frame(width: 50, height: 50)
                                        .background(.ultraThinMaterial)
                                        .cornerRadius(10)
                                        .shadow(radius: 4, y: 4)
                                    
                                }.opacity(isLoading ? 0 : 1)
                                
                            }
                            
                        }.padding(.bottom, 20)
                        
                    }
                    
                }
                
            }.edgesIgnoringSafeArea(.horizontal)
            
        }.fullScreenCover(isPresented: $showBarcode) {
            
            BarcodeScannerView(presented: $showKitchINSight, ingredients: $ingredients)
                .navigationBarBackButtonHidden(true)
            
        }.fullScreenCover(isPresented: $showKitchINSight) {
            
            KitchINSightView(presented: $showKitchINSight, ingredients: $ingredients)
                .navigationBarBackButtonHidden(true)
            
        }
        
    }
    
    // Private functions
    func sendMessage() {
        
        self.isLoading = true
        
        self.messages.append(Message(id: messages.count, who: "YOU", content: self.question, ingredients: []))
        
        let request = self.question
        self.question = ""
        
        AF.request("https://KitchIN-2023.uc.r.appspot.com/api/v1/process", method: .post, parameters: ["message": request, "ingredients": ingredients]).responseData() { response in
            
            self.isLoading = false
            
            self.messages.append(Message(id: messages.count, who: "KitchAI", content: String(data: response.data!, encoding: .utf8)!, ingredients: []))
            
        }
        
    }
    
}

struct Message: Identifiable {
    
    var id: Int
    var who: String
    var content: String
    var ingredients: [String]
    
}



#Preview {
    MainView()
}
