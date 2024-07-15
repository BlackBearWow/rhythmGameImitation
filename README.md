# rhythmGameImitation

초기

- [x] index페이지에 리듬게임 리스트 보여주기
- [x] 리듬게임 리스트를 클릭하면 해당 리듬게임 페이지로 이동
- [x] 해당 리듬게임 정보를 받아서 정보를 해독한다
- [x] 화면에 배경 보이기
    canvas가 이상해지는 문제가 생김. 해결
- [x] miss판정 만들기
- [x] hit판정 만들기
- [x] 시간에 따라 노트 보이기
    4k 5k 6k 7k 8k 모두 지원
- [x] 점수 만들기
- [x] 유튜브 재생?
    - 동영상 재생은 불가능하다. avi확장자라서 browser에서 재생 불가능. 재생 가능한 확장자는 mp4, ogg, webm뿐이다.
    - youtube iframe_api를 알아보자. 대체할 수 있을 것 같다. 
    - Indicate whether to send a cookie in a cross-site request by specifying its SameSite attribute 오류발견. https를 해보자.
    - https://stackoverflow.com/questions/51424578/embed-youtube-code-is-not-working-in-html 애초에 위는 오류가 아니었다. 그냥 도메인이 없는곳에서 동영상을 제한한것.
- [x] 누를 때 효과 나오게
- [x] hit miss일 때 효과음

발전과제

- [] 곡 제목들, 곡마다 비트맵 제목은 영구저장, 비트맵 정보는 휘발성 storage로 저장
- [] db에 rhytm DB, song table - songName id bitmapId, bitmap table - id bitmapName bitmapStar만들기
- [] 로그인
- [] 노트 업로드
- [] 노트 만들기
- [] 곡 선택 창에서 백그라운드 뮤직 나오게
- [] 곡 선택 창에서 유튜브 영상 보이게