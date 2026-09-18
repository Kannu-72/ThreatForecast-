# Feature parity gate

The production feature engine implements the frozen 45-feature contract and consumes real 10-second packet windows. Before using the live extractor as a scientific reproduction of the Kaggle training pipeline, compare a sample of the production extractor against the previously generated training feature table on the same packets.

This is a parity gate, not a model change. The model expects the exact ordered 45-feature vector.

The package intentionally does not include Kaggle training data or training arrays.
