import 'package:flutter/material.dart';
import 'home_page.dart';
import 'config_page.dart';
import 'debug_page.dart';

class MainPage extends StatefulWidget {
  const MainPage({super.key});

  @override
  State<MainPage> createState() => _MainPageState();
}

class _MainPageState extends State<MainPage> {
  int _selectedIndex = 0;
  late PageController _pageController;
  bool _isAnimating = false; // 标志位：是否正在执行点击触发的动画

  // 定义导航项对应的页面
  static const List<Widget> _pages = [
    HomePage(),
    ConfigPage(),
    DebugPage(),
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: _selectedIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onItemTapped(int index) {
    if (_selectedIndex == index) return; // 点击当前页面，不做任何操作
    
    // 立即更新选中状态，避免底部导航栏图标闪现
    setState(() {
      _selectedIndex = index;
      _isAnimating = true; // 标记开始动画
    });
    
    // 所有页面切换都使用动画
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    ).then((_) {
      // 动画完成后，清除标记
      setState(() {
        _isAnimating = false;
      });
    });
  }

  void _onPageChanged(int index) {
    // 如果是点击触发的动画，忽略这个回调（避免闪现）
    // 如果是手势滑动，正常更新状态
    if (!_isAnimating) {
      setState(() {
        _selectedIndex = index;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('SyncClipboard'),
        // 可以根据当前页面显示不同的标题
        // title: Text(_getTitle(_selectedIndex)),
      ),
      body: PageView(
        controller: _pageController,
        onPageChanged: _onPageChanged,
        children: _pages,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: _onItemTapped,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: '首页',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings),
            label: '设置',
          ),
          NavigationDestination(
            icon: Icon(Icons.bug_report_outlined),
            selectedIcon: Icon(Icons.bug_report),
            label: '调试',
          ),
        ],
      ),
    );
  }
}
