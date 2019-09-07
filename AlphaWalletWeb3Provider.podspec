#
# Be sure to run `pod lib lint TrustWeb3Provider.podspec' to ensure this is a
# valid spec before submitting.
#
# Any lines starting with a # are optional, but their use is encouraged
# To learn more about a Podspec see http://guides.cocoapods.org/syntax/podspec.html
#

Pod::Spec.new do |s|
  s.name             = 'AlphaWalletWeb3Provider'
  s.version          = '0.3.0'
  s.summary          = 'Web3 javascript wrapper provider for iOS and Android platforms.'

  s.description      = <<-DESC
  Web3 javascript wrapper provider for iOS and Android platforms.
  The magic behind the dApps browsers
                       DESC

  s.homepage         = 'https://github.com/AlphaWallet/AlphaWalletWeb3Provider'
  s.license          = { :type => 'MIT', :file => 'LICENSE' }
  s.author           = { 'hewigovens' => 'hewigovens@gmail.com', 'Viktor Radchenko' => 'vikmeup' }
  s.source           = { :git => 'https://github.com/AlphaWallet/AlphaWalletWeb3Provider.git', :tag => s.version.to_s }
  s.social_media_url = 'https://twitter.com/AlphaWallet'
  s.ios.deployment_target = '8.0'

  s.resource_bundles = {
    'AlphaWalletWeb3Provider' => ['dist/AlphaWallet-min.js']
  }
end
