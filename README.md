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

- [x] db에 rhythm DB, songs table, bitmap table 만들기
- [x] 모든 곡 갱신 버튼 기능. songs와 bitmap을 indexedDB에 넣기
- [x] index페이지에 리듬게임 리스트 보여주기
- [x] playRhythmGame페이지에서 noteInfo indexedDB에 저장및 활용
- [x] 곡 선택 창 디제이맥스처럼 - css는 transition을 활용하자
- [x] 곡 선택 창에서 곡 검색 기능 - osu숫자, 작곡가, 제목, 태그
- [x] 곡 선택 창에서 백그라운드 뮤직 나오게 - 검색 왼쪽에 (재생,일시정지),정지 진행상황을 가진 백그라운드 뮤직 기능. 곡 선택을 1초이상 하지 않으면 재생한다.
- [x] 곡 플레이시 약간의 텀 만들기
- [] 곡 선택 창에서 태그 선택 기능
- [x] 서버에 곡 추가 기능
- [] 곡에 youtubeId 추가 기능