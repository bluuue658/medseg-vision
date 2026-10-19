# Demo data sources

This repository presents de-identified two-dimensional medical image slices and their corresponding segmentation visualizations for research and interface demonstration only. The outputs are not clinical diagnoses.

## Left atrial (LA) samples

- Source dataset: [Left Atrial Segmentation Challenge 2013: MRI testing](https://figshare.com/articles/dataset/Left_Atrial_Segmentation_Challenge_2013_MRI_testing/1492989)
- License: [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)
- Citation: Tobon-Gomez C, Geers AJ, Peters J, et al. *Benchmark for Algorithms Segmenting the Left Atrium From 3D CT and MRI Datasets*. IEEE Transactions on Medical Imaging. 2015;34(7):1460–1473.
- Website transformation: source volumes were converted into de-identified two-dimensional WebP previews for this interactive visualization.

## PROMISE12 prostate samples

- Source dataset: [PROMISE12 Challenge data](https://zenodo.org/records/8026660)
- Published subset: 10 paired MRI volumes, reference masks, and model predictions supplied for this demonstration.
- Website transformation: a representative annotated slice was selected from each volume and exported as a WebP preview. Original filenames, source volume headers, acquisition metadata, and case identifiers are not published.
- Public labels use sequential anonymous identifiers from `001` through `010`.

## Use notice

All samples on the website are provided only to demonstrate the image-selection and segmentation-result interface. Do not use the displayed results as a substitute for professional medical judgment.
