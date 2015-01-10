# Deploy with new API:
# - rake preview
# - visit http://0.0.0.0:4567 and verify everything was generated correctly
# - ensure data/api.yml has the correct sha/tag, if not just simply update it and use middleman to re-preview

# Deploy without updating the API:
# - middleman
# - visit http://0.0.0.0:4567 and verify everything was generated correctly
# - rake deploy

require "bundler/setup"
require 'yaml'
require 'geocoder'

def git_initialize(repository)
  unless File.exist?(".git")
    system "git init"
    system "git remote add origin git@github.com:emberjs/#{repository}.git"
  end
end

def git_update
  system "git fetch origin"
  system "git reset --hard origin/master"
  # Remove all files so we don't accidentally keep old stuff
  # These will be regenerated by the build process
  system "rm `git ls-files`"
end

def ember_path
  File.expand_path(ENV['EMBER_PATH'] || File.expand_path("../../ember.js", __FILE__))
end

def ember_data_path
  File.expand_path(ENV['EMBER_DATA_PATH'] || File.expand_path("../../ember-data", __FILE__))
end


def generate_ember_docs
  output_path = 'api.yml'
  repo_path = ember_path
  sha = ENV['EMBER_SHA']

  print "Generating docs data from #{repo_path}... "

  Dir.chdir(repo_path) do
    # returns either `tag` or `tag-numcommits-gSHA`
    unless sha
      describe = `git describe --tags --always`.strip
      sha = describe =~ /-g(.+)/ ? $1 : describe
    end

    sh('npm run docs')
  end

  # JSON is valid YAML
  data = YAML.load_file(File.join(repo_path, "docs/data.json"))
  data["project"]["sha"] = sha
  File.open(File.expand_path("../data/#{output_path}", __FILE__), "w") do |f|
    YAML.dump(data, f)
  end

  puts "Built #{repo_path} with SHA #{sha}"
end

def generate_ember_data_docs
  repo_path = ember_data_path
  sha = ENV['EMBER_DATA_SHA']

  print "Generating docs data from #{repo_path}... "

  Dir.chdir(repo_path) do
    # returns either `tag` or `tag-numcommits-gSHA`
    unless sha
      describe = `git describe --tags --always`.strip
      sha = describe =~ /-g(.+)/ ? $1 : describe
    end

    sh("npm install && npm run dist")
  end

  # JSON is valid YAML
  data = YAML.load_file(File.join(repo_path, "dist/docs/data.json"))
  data["project"]["sha"] = sha
  File.open(File.expand_path("../data/#{output_path}", __FILE__), "w") do |f|
    YAML.dump(data, f)
  end

  puts "Built #{repo_path} with SHA #{sha}"
end

def geocode_meetups
  output_path = 'meetups.yml'
  puts "Geocoding records from #{output_path}... "

  data = YAML.load_file(File.expand_path("./data/#{output_path}"))
  meetups = data["locations"].values.flatten
  meetups.each do |meetup|
    coord = Geocoder.coordinates(meetup["location"])
    if coord.nil?
      puts "Unable to find coordinates for #{meetup["location"]}"
      next
    end
    meetup["lat"] = coord[0]
    meetup["lon"] = coord[1]
    puts "Found coordinates for #{meetup["location"]}"
    #throttle requests to API to avoid errors
    sleep 0.1
  end

  File.open(File.expand_path("../source/data/meetup_locations.json", __FILE__),"w") do |f|
    f.write(meetups.to_json)
  end
  # File.open(File.expand_path("../data/#{output_path}", __FILE__), "w") do |f|
  #   YAML.dump(data, f)
  # end
end

def build
  system "middleman build"
end

desc "Generate API Docs"
task :generate_docs do
  generate_ember_docs
  generate_ember_data_docs
end

desc "Build the website"
task :build => :generate_docs do
  build
end

desc "Preview"
task :preview do
  require 'listen'

  Rake::Task["generate_docs"].execute

  paths = Dir.glob(File.join(ember_path, "packages/*/lib")) +
    Dir.glob(File.join(ember_data_path, "packages/*/lib"))

  listener = Listen.to(*paths, :only => /\.js$/) do
    Rake::Task["generate_docs"].execute
  end
  listener.start

  trap :SIGINT do
    exit 0
  end

  system "middleman server --reload-paths data/"
end

desc "Deploy the website to github pages"
task :deploy do |t, args|
  require "highline/import"
  message = ask("Provide a deployment message:  ") do |q|
    q.validate = /\w/
    q.responses[:not_valid] = "Can't be empty."
  end

  mkdir_p "build"
  Dir.chdir "build" do
    git_initialize("emberjs.github.com")
    git_update

    unless build
      puts "The build failed, stopping deploy. Please fix build errors before re-deploying."
      exit 1
    end

    # This screws up the build and isn't necessary
    # rm_r "source/examples"

    File.open("CNAME", 'w') do |f|
      f.write "emberjs.com"
    end

    system "git add -A"
    system "git commit -m '#{message.gsub("'", "\\'")}'"
    system "git push origin master" unless ENV['NODEPLOY']
  end
end

desc "Find coordinates for meetup locations"
task :geocode do
  geocode_meetups
end
