# Native integration boundary

Legacy SMS and ONNX modules have been removed. No Pleos SDK is installed yet.
Add a Kotlin bridge only after SDK access and dependencies are verified.
The phone build must exclude automotive-only dependencies, not just avoid calling them.
Before adding a local Expo module here (autolinked by default), implement and test build-specific linking.
