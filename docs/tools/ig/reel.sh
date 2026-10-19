#!/bin/bash
# リール（1080×1920・30fps）を組み立てる
set -e
D=/tmp/claude-0/-home-user--/7aac3a01-e435-58a5-8958-b9e0c86a0373/scratchpad/ig
R=$D/reel
V=$D/vid
cd "$R"

# 山場のふたつ：モーダルだけを切り出す（x22 y232 388×484 → 幅900）
seg () {  # $1=元 $2=開始 $3=長さ $4=crop $5=scale $6=x $7=y $8=下敷き $9=出力
  ffmpeg -v error -y -loop 1 -i "$8" -ss "$2" -t "$3" -i "$1" \
    -filter_complex "[1:v]crop=$4,scale=$5,setpts=PTS-STARTPTS,format=rgba, \
       pad=iw+10:ih+10:5:5:color=0x00000000[v]; \
     [0:v][v]overlay=$6:$7:format=auto,format=yuv420p,fps=30[o]" \
    -map "[o]" -t "$3" -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p "$9"
  echo "   $9"
}

seg "$V/b.webm" 1.6 10 "388:484:22:232" "900:-2" 90 500 bg1.png s1.mp4
seg "$V/c.webm" 1.6  7 "388:484:22:232" "900:-2" 90 500 bg2.png s2.mp4
seg "$V/a.webm" 2.6  4.6 "430:950:0:0" "-2:1120" 291 480 bg3.png s3.mp4
seg "$V/a.webm" 7.9  8.4 "396:236:19:166" "1000:-2" 40 740 bg4.png s4.mp4

# 終わりの一枚（3秒・静止）
ffmpeg -v error -y -loop 1 -i bg5.png -t 3 -r 30 \
  -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p s5.mp4
echo "   s5.mp4"

printf "file '%s'\n" s1.mp4 s2.mp4 s3.mp4 s4.mp4 s5.mp4 > list.txt
ffmpeg -v error -y -f concat -safe 0 -i list.txt -c copy "$D/out/reel-1080x1920.mp4"
ffprobe -v error -show_entries format=duration,size -show_entries stream=width,height -of default=nw=1 "$D/out/reel-1080x1920.mp4"
