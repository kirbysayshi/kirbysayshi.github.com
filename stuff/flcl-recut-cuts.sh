# note: this might not be the exact loop used.
for f in Fooly.Cooly.E0*; do ffmpeg -i $f -map 0:v -c copy $f.mp4 -map 0:a:0 -c copy $f.ac3; done

mkdir -p cuts
ffmpeg -ss 00:00:00 -i Fooly.Cooly.E01.720p.BluRay.x264-aAF.mkv.mp4 -to 00:21:51.501 -c copy -avoid_negative_ts 1 cuts/01.mp4
ffmpeg -ss 00:00:00 -i Fooly.Cooly.E02.720p.BluRay.x264-aAF.mkv.mp4 -to 00:20:42.347 -c copy -avoid_negative_ts 1 cuts/02.mp4
ffmpeg -ss 00:00:00 -i Fooly.Cooly.E03.720p.BluRay.x264-aAF.mkv.mp4 -to 00:20:38.561 -c copy -avoid_negative_ts 1 cuts/03.mp4
ffmpeg -ss 00:00:00 -i Fooly.Cooly.E04.720p.BluRay.x264-aAF.mkv.mp4 -to 00:22:05.575 -c copy -avoid_negative_ts 1 cuts/04.mp4
ffmpeg -ss 00:00:00 -i Fooly.Cooly.E05.720p.BluRay.x264-aAF.mkv.mp4 -to 00:20:48.399 -c copy -avoid_negative_ts 1 cuts/05.mp4
cp Fooly.Cooly.E05.720p.BluRay.x264-aAF.mkv.mp4 cuts/06.mp4

for f in cuts/*; do echo "file '$f'" >> concats.txt; done

ffmpeg -f concat -i concats.txt -c copy FLCL-Recut.mp4

mkdir -p cuts-sneaks
ffmpeg -ss 00:24:14.000 -i Fooly.Cooly.E01.720p.BluRay.x264-aAF.mkv.mp4 -c copy -avoid_negative_ts 1 cuts-sneaks/01.mp4
ffmpeg -ss 00:23:05.000 -i Fooly.Cooly.E02.720p.BluRay.x264-aAF.mkv.mp4 -c copy -avoid_negative_ts 1 cuts-sneaks/02.mp4
ffmpeg -ss 00:23:03.000 -i Fooly.Cooly.E03.720p.BluRay.x264-aAF.mkv.mp4 -c copy -avoid_negative_ts 1 cuts-sneaks/03.mp4
ffmpeg -ss 00:24:29.500 -i Fooly.Cooly.E04.720p.BluRay.x264-aAF.mkv.mp4 -c copy -avoid_negative_ts 1 cuts-sneaks/04.mp4
ffmpeg -ss 00:23:12.000 -i Fooly.Cooly.E05.720p.BluRay.x264-aAF.mkv.mp4 -c copy -avoid_negative_ts 1 cuts-sneaks/05.mp4

for f in cuts-sneaks/*; do echo "file '$f'" >> concats-sneak.txt; done
ffmpeg -f concat -i concats-sneak.txt -c copy FLCL-Recut-Sneaks.mp4
